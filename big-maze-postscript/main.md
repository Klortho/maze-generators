# big-maze in PostScript

## See also

* [computer/maze-generation]


## Description

This is an experiment in manipulating a PostScript file with NodeJS.

What the script does is tile the original postscript image across several
pages. Set `scale` inside the script to a positive integer, and the script
will write `scale^2` postscript files that each display one rectangular
portion of the full maze.


## To do

### Change it to create one .ps file that encodes all the pages

It shouldn't be too hard to have it use "document structuring conventions" to write
a single multi-page postscript file. See the DSC specification psstruct.ps in
[computer/postscript]. To keep the file size reasonable, you'd want to filter the
paths so that only the visible ones (with some suitable overlap) are rendered on
a given page.
