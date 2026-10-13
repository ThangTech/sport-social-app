"""Export the pinned, trained brand detector using its original YOLOv5 source."""

import argparse
import hashlib
import json
import pathlib
import sys

import numpy as np
import onnx
import onnxruntime as ort
import torch


SOURCE_REVISION = "2e20b8aaae6440ad1cefd56cf5c017c49fa03e88"
YOLO_REVISION = "8efe97719c9b3b77c9db9b5c8592e051b7f0c9a7"
CHECKPOINT_SHA256 = "5288078818038f3e973332c585738e4bf5dd4d50cee95c5d85705395656f292a"
LABELS = [
    "Adidas", "Apple Inc-", "Chanel", "Coca-Cola", "Emirates",
    "Hard Rock Cafe", "Mercedes-Benz", "NFL", "Nike", "Pepsi",
    "Puma", "Starbucks", "The North Face", "Toyota", "Under Armour",
]


class DetectionOutput(torch.nn.Module):
    def __init__(self, model):
        super().__init__()
        self.model = model

    def forward(self, images):
        return self.model(images)[0]


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", required=True, type=pathlib.Path)
    parser.add_argument("--weights", required=True, type=pathlib.Path)
    parser.add_argument("--output", required=True, type=pathlib.Path)
    args = parser.parse_args()
    weights = args.weights.resolve()
    output = args.output.resolve()

    checksum = hashlib.sha256(weights.read_bytes()).hexdigest()
    if checksum != CHECKPOINT_SHA256:
        raise ValueError("Checkpoint SHA-256 does not match the reviewed source.")

    sys.path.insert(0, str(args.source.resolve()))
    from models.experimental import attempt_load

    # The upstream checkpoint was saved on Linux; only remap paths while loading.
    original_posix_path = pathlib.PosixPath
    try:
        if sys.platform == "win32":
            pathlib.PosixPath = pathlib.WindowsPath
        model = attempt_load(str(weights), map_location="cpu")
    finally:
        pathlib.PosixPath = original_posix_path

    names = model.names
    if isinstance(names, dict):
        names = [names[index] for index in range(len(names))]
    if list(names) != LABELS:
        raise ValueError(f"Unexpected class ordering: {names}")

    torch.set_num_threads(2)
    model = DetectionOutput(model).eval()
    torch.manual_seed(0)
    sample = torch.rand(1, 3, 640, 640)
    with torch.no_grad():
        expected = model(sample).numpy()
        output.parent.mkdir(parents=True, exist_ok=True)
        torch.onnx.export(
            model,
            sample,
            str(output),
            input_names=["images"],
            output_names=["detections"],
            opset_version=12,
            do_constant_folding=True,
            dynamo=False,
        )

    graph = onnx.load(str(output))
    onnx.helper.set_model_props(graph, {
        "names": json.dumps(LABELS),
        "output_format": "YoloV5",
        "source_revision": SOURCE_REVISION,
        "checkpoint_sha256": CHECKPOINT_SHA256,
    })
    onnx.checker.check_model(graph)
    onnx.save(graph, str(output))

    session = ort.InferenceSession(str(output), providers=["CPUExecutionProvider"])
    actual = session.run(None, {"images": sample.numpy()})[0]
    if actual.shape != (1, 25200, 20):
        raise ValueError(f"Unexpected output shape: {actual.shape}")
    np.testing.assert_allclose(actual, expected, rtol=0.001, atol=0.002)

    manifest = {
        "source": "https://github.com/dvdimitrov13/Logo_Detection",
        "sourceRevision": SOURCE_REVISION,
        "yoloRevision": YOLO_REVISION,
        "checkpointSha256": CHECKPOINT_SHA256,
        "onnxSha256": hashlib.sha256(output.read_bytes()).hexdigest(),
        "inputShape": [1, 3, 640, 640],
        "outputShape": list(actual.shape),
        "labels": LABELS,
        "maxExportDifference": float(np.abs(actual - expected).max()),
    }
    manifest_path = output.with_suffix(".json")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, indent=2))


if __name__ == "__main__":
    main()
