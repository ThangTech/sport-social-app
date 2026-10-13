# Local brand logo detection

The API uses `brand-logos-yolov5s.onnx`, a CPU model exported from the trained
`yolo1000_s_cust/weights/best.pt` checkpoint in
[dvdimitrov13/Logo_Detection](https://github.com/dvdimitrov13/Logo_Detection).
No Python installation, remote inference API, API key or per-request service fee
is needed when running the application.

## Configuration and deployment

`appsettings.json` sets `LogoDetection:ModelPath`, `OutputFormat = YoloV5` and
the 15 class labels in the exact order from the checkpoint. The API checks label
order against the ONNX metadata. Restart the API after changing model settings.
The project copies the ONNX file into both build and publish output.

Labels: Adidas, Apple Inc-, Chanel, Coca-Cola, Emirates, Hard Rock Cafe,
Mercedes-Benz, NFL, Nike, Pepsi, Puma, Starbucks, The North Face, Toyota,
Under Armour. Other brands are outside this model's supported classes.

Input: RGB float32 `[1,3,640,640]`, divided by 255, letterboxed with padding 114.
Output: `[1,25200,20]`, with center x/y, width/height, objectness and 15 class scores.
Confidence is objectness multiplied by class score; threshold is 0.35.
Class-aware NMS uses IoU 0.45. Boxes are clamped to the original oriented image.
YOLOv8 exports with `[1,4+classCount,anchorCount]` remain supported by setting
`OutputFormat = YoloV8` and supplying a matching model and label list.

New or replaced post images are analyzed automatically. Both system and group
review queues receive the result. Old uploads are not automatically rescanned.
The admin-only `POST /api/v1/logo-detector/analyze-logo` accepts multipart `file`
for a standalone check. Upload limits: 20 MB; analysis limit: 40 million pixels.

Missing model/labels returns `unavailable`; corrupt model/image returns `failed`;
video or oversized image returns `manual`. A successful scan returns `analyzed`,
including when no supported logo is found. None of these results approves or
rejects a post. A logo is only a review hint, not proof of copyright infringement.

## Reproduce the export (development only)

Use Python 3.11 and a separate virtual environment. The exporter verifies the
checkpoint hash before loading it and compares ONNX output with PyTorch output.
Run from the repository root; downloads and Python packages stay in `.tools/`.

```powershell
$ProgressPreference = 'SilentlyContinue'
New-Item -ItemType Directory -Path .tools/logo-export -Force
python -m venv .tools/logo-export/venv
& .tools/logo-export/venv/Scripts/python.exe -m pip install -r scripts/logo-model/requirements.txt

$source = 'https://github.com/ultralytics/yolov5/archive/8efe97719c9b3b77c9db9b5c8592e051b7f0c9a7.zip'
Invoke-WebRequest $source -OutFile .tools/logo-export/yolov5.zip
Expand-Archive .tools/logo-export/yolov5.zip .tools/logo-export -Force

$weights = 'https://media.githubusercontent.com/media/dvdimitrov13/Logo_Detection/2e20b8aaae6440ad1cefd56cf5c017c49fa03e88/runs/train/yolo1000_s_cust/weights/best.pt'
Invoke-WebRequest $weights -OutFile .tools/logo-export/best.pt

& .tools/logo-export/venv/Scripts/python.exe scripts/logo-model/export_model.py `
    --source .tools/logo-export/yolov5-8efe97719c9b3b77c9db9b5c8592e051b7f0c9a7 `
    --weights .tools/logo-export/best.pt `
    --output backend/src/SocialSport.Api/Models/brand-logos-yolov5s.onnx
```

`brand-logos-yolov5s.json` records source revisions, SHA-256 checksums, shapes,
labels and export comparison. The source repository's MIT notice and the pinned
YOLOv5 source's GPL-3.0 license are retained alongside the model. See
`LOGO-SOURCE-LICENSE.txt` and `YOLOV5-LICENSE.txt`; keep these notices when copying
or distributing the model.

## Checks

```powershell
dotnet run --project backend/tests/SocialSport.SmokeTests
dotnet run --project backend/tests/SocialSport.SmokeTests -- --logos-only
```

The suite tests real .NET inference, an annotated Nike photo, blank images,
coordinate transforms, class-aware NMS, confidence calculation, concurrent calls,
cancellation and explicit fallback states. It also exercises the protected admin
endpoint and image uploads through both moderation queues. A few fixture photos
are integration checks, not a measurement of general recognition accuracy.

Verified on 2026-10-11: 65 full-suite assertions passed; 17 inference-only assertions
passed. Eight upstream validation photos (two each for Nike, Adidas, Puma and
Under Armour) returned their annotated class. Maximum raw export difference on
the seeded comparison tensor was 0.000732421875. Build and publish both included
the model, and the published model SHA-256 matched the manifest.
