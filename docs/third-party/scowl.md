# SCOWL dictionary attribution

Useless Guess bundles a modified selection of SCOWL 2020.12.07 by Kevin Atkinson
and contributors. Collective work Copyright 2000-2018 Kevin Atkinson, together
with component copyrights specified in the full upstream notice. No author
endorsement is implied.

- Source: https://downloads.sourceforge.net/project/wordlist/SCOWL/2020.12.07/scowl-2020.12.07.tar.gz
- Source repository tag: https://github.com/en-wl/wordlist/tree/rel-2020.12.07
- Archive SHA-256: `5587667caa20c4891390c2d42dbb4d5c4c3f41bee77af1457ece3ba23fb859cc`.
- The release identifies source checkpoint `5ef55f9`.
- [Full original copyright/licence notice beside bundled data](../../apps/web/src/lib/games/words/SCOWL-Copyright.txt).
- [Identical notice shipped publicly](../../apps/web/public/licenses/scowl-2020.12.07.txt),
  linked as Word list credits from the game. Both copies preserve the full upstream
  bytes, component notices, disclaimers and non-endorsement conditions. The collective
  licence is MIT-like with additional component terms; it is not relabelled SPDX-MIT.

## Modifications and reproducible selection

Read the 2020.12.07 release's Latin-1 `final/english-words.N` and
`final/american-words.N`, for N = 10, 20, 35, 40, 50, 55, 60 (14 files).
Keep only complete original lowercase ASCII lines matching `^[a-z]{5}$`;
deduplicate, sort and then uppercase. Do not lowercase before filtering, strip
accents/punctuation, add inflections or include other categories/variants.
This yields exactly **5,063 accepted guesses** using US-English spellings.

The **823 answers** are the owner-approved manually curated familiar subset in
[the task appendix](../tasks/useless-guess.md#approved-answer-subset), selected from
1,365 five-letter entries at levels 10/20 under the same procedure. All answers
belong to the broader accepted set. The implementation bundles static arrays in
`src/lib/games/words/word-list.ts`, normalized through the existing rules. No remote
runtime word service, database, package dependency or silent dictionary update.

These transformations and the answer curation are modifications by this application;
the upstream authors did not choose or endorse the answer subset. Retain this
provenance and the complete notices with redistributed dictionary copies.
