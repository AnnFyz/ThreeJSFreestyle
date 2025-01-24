# ThreeJSFreestyle
## Project concept
Website project with 3D interactable elements as intro website for the vr game.

## Project architecture 
in the project I built 4 levels, only the scene of the active level will be interactable and rendered. Each Level is an independent class with its own logic, objects and interactions. But all Levels share same functions, witch will be called in the main.ts. All clickable objects in the levels 1,2 and 3 are instances of class button. In the level 4 the instances of Enemy class are allso clickable. The project is a linear sequence of click events, which leads at the end to the Website with the game, for which this Website was built. 

## References
* JaveScript: https://www.udemy.com/course/the-complete-javascript-course/learn/lecture/22648465?start=0#overview
* Vite setup with TypeScript: https://sbcode.net/threejs/
* Outline Shader: https://www.youtube.com/watch?v=V5UllFImvoE&ab_channel=Visionary3D
* Procedural Text Geometry : https://threejs.org/docs/#manual/en/introduction/Creating-text
* Vector math for enemies following the waypoints and rotating in the right direction:
** https://discussions.unity.com/t/how-to-calculate-direction-between-2-objects/103715
** https://discourse.threejs.org/t/check-if-positions-are-behind-object/35451
** https://stackoverflow.com/questions/2263762/flipping-an-angle-using-radians
 
