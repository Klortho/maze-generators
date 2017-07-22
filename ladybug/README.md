# Ladybug Maze

[See it live](http://chrismaloney.org/wumzom/maze.html)

A maze comprises cells and walls.  For simplicity, to get started, we'll
just do a maze from a 2d rectangular array of square cells.  Another possibility,
for example, would be an hexagonal array.

## To do

If I have time, here is what I'd like to do.

* Find better sounds, background music (something liberally licensed!)

* Fix for IE; right now, it is broken.

* Initialize the canvas to the size of the viewport.  Then, scale the maze accordingly.
  This suggests another option, a switch to specify how the rows X cols size is
  determined:
    - fixed: dependent options are rows and cols
    - adjustable: maze size according to the size and shape of the canvas:
      dependent options would be density and the cell aspect ratio

* Tweaks:
    * When you try to move, but you're blocked by a wall, the
    * Make "jump easing" sticky
    * Invert the speed values:  9 should be fast, 0 slow.
    * Add some kind of star at the finish cell
    * Once you reach the finish, game is over - disable keys.

* Make the form fields, when possible, dynamic.  E.g., unchecking sound
  should turn sound off right away.

* Animate the legs.  See notes [here](http://chrismaloney.org/notes/Fabric.js#sprites)

* Fix it so that only one sound effect plays at a time.  (Maybe not)

* Allow it to be controlled by a touchscreen

* (Maybe) If using the arrow keys, add asteroids-like physics:  when you press an
  arrow key, the sprite *accelerates* in that direction.

* Implement a timer and scoring mechanism.
    * Start with the highest possible score for a maze, computed based on
      its size.  E.g. 10X10 == 100 pts.  Then, penalties for:
    * Fixed amount every second.
    * At the end, any dots that are not on the main path,
    * Every time you hit a wall.

* Implement invisible walls:  there are two options (implement both):
    * sighted:  the walls in the sprite's line of sight are made visible
    * blind:  only when you bump into a wall does it become visible
  The walls' visibility decays (either after they're no longer in your line of
  sight, or immediately after you bump into them) and the decay rate is variable

* Persist user data, preferences, high scores, etc.  Ruby on Rails deployed
  through [Phusion Passenger](https://www.phusionpassenger.com/), perhaps?
