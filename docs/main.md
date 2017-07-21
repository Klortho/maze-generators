---
- name: maze-generation-scheme-post
  type: blog-post
  title: Maze generation
  url: http://www.ccs.neu.edu/home/shivers/mazes.html
  local:
    filename: {name}.mhtml
    retrieved: 2017-07-03
  notes: >
    This describes the algorithm that I used originally, and then an improved
    algorithm that uses a fast union/find disjoint-set data-structure. He says
    that the first algorithm's mazes suffer from a low branch factor. Is this
    true? I'm skeptical. Maybe it depends on the algorithm that you use when
    deciding which cell to jump to, once you've reached a dead end.
- name: maze-program-obfuscated-c
  type: blog post
  title: The art of obfuscation
  local:
    filename: {name}.mhtml
    retrieved: 2017-07-03
  url: https://web.archive.org/web/20040217140051/http://homepages.cwi.nl/~tromp/maze.html
  notes: >
    Extremely cool

- name: maze-generator-in-c
  type: blog-post
  title: Making Mephistophelean mazes
  local:
    filename: {name}.mhtml
    retrieved: 2017-07-03
  url: https://web.archive.org/web/20000528124053/http://www.pmms.cam.ac.uk/~gjm11/programs/maze/index.html
...
