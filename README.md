# ThreeJSFreestyle
## Project concept
A website created as an introduction to the VR game, integrating interactive 3D elements.
## Project architecture 
The project consists of a website featuring four levels, with only one level active at any given time. The scene of the active level is interactable and rendered. Each level is implemented as an independent class, containing its own logic, objects, and interactions. However, all levels share a set of common functions, which are managed and called through the main.ts.
* Levels 1, 2, and 3 feature clickable objects that are instances of the Button class.
* Level 4 introduces clickable objects that are instances of the Enemy class, in addition to the Button class.
The project follows a linear progression of click events, eventually leading to the final website that showcases the VR game for which this introductory website was built.

## References
* JaveScript: https://www.udemy.com/course/the-complete-javascript-course/learn/lecture/22648465?start=0#overview
* Vite setup with TypeScript: https://sbcode.net/threejs/
* Outline Shader: https://www.youtube.com/watch?v=V5UllFImvoE&ab_channel=Visionary3D
* Procedural Text Geometry : https://threejs.org/docs/#manual/en/introduction/Creating-text
* Vector mathematics for guiding enemies along waypoints while ensuring they rotate to face the correct direction:
** https://discussions.unity.com/t/how-to-calculate-direction-between-2-objects/103715
** https://discourse.threejs.org/t/check-if-positions-are-behind-object/35451
** https://stackoverflow.com/questions/2263762/flipping-an-angle-using-radians
 
