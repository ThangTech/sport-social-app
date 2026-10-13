# Vietnamese word filter

Source: https://github.com/behitek/vietnam-sensitive-words/blob/master/bad_words.json
Imported on 2026-10-11. Underscores were converted to spaces; the three existing
application terms were retained. The same snapshot is bundled in mobile/src/data.
The upstream repository is archived and includes political terms as well as profanity.
Review this list for your community's rules; matches do not understand context.

The client and server use Unicode NFKC, lowercase, removal of invisible format
characters, and punctuation-to-space normalization. Matching is by whole words or
phrases, preserving Vietnamese accents to reduce false positives. It is a first
filter, not a guarantee against all misspellings or deliberate evasions.

The list is bundled locally. No text is sent to a third-party moderation service.
