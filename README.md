# ng-photo-grid
photo grid like facebook in angular js with no dependencies.

### [Demo page](http://jerryc-nguyen.github.io/ng-photo-grid/)


Directive can be used with these options:

| Option         | Description                                                                                                                                 | Value    | Default        |
|----------------|---------------------------------------------------------------------------------------------------------------------------------------------|----------|----------------|
| urlKey         | object attribute present for image url  ex:{url:  "/example.jpg"} => urlKey: "url"                                                          | string   | "original_url" |
| sortByKey      | object attribute present for order of object in array ex:[{nth: 1}, {nth: 2}] => sortByKey: "nth"                                           | string   | "nth"          |
| onClicked      | image click handler, argument was clicked image object                                                                                      | function | none           |
| onBuilded      | callback when grid was built completed                                                                                                      | function | none           |
| margin         | space between each image on grid                                                                                                            | number   | 2              |
| maxLength      | maximum objects in array grid choose to build                                                                                               | number   | 5              |
| isSquare       | options to build grid has the height equals to width ex: used to display grid of grids without break layout                                 | boolean  | false          |
| buildOnLoading | option to trigger build grid, grid be built while images loading if it's true. Otherwise, grid will be built only one when all image loaded | boolean  | true           |

This directive used to built the grid of images (let's look at the demo source code to see how the array of images look like), so you should prepare the array of image object then do like this:
####1. Inject module to your angular app:
    ```javascript
    angular.module("ngApp", ["ngPhotoGrid"])
    ```
####2. On your controller, you should define the options and events handler if needed like this:
    ```javascript
      $scope.gridOptions = {
        urlKey      :     "original_url",
        sortKey     :     "nth",
        onClicked   :     function(image) {
                            alert(JSON.stringify(image))
                          },
        onBuilded   :     function() {
                            console.log ("built completed!")
                            $scope.isBuildingGrid = false;
                            $scope.$apply()
                          },
        margin      :     2,
        maxLength   :     7
      }
    ```
####3. Then call in your template:
    ```javascript
    <div ng-photo-grid="" images="images" grid-options="gridOptions"></div>
    ```
####4. Open browser, if your images were random, you can refresh (F5) browser again to see others style of grid was built.

#MIT License

