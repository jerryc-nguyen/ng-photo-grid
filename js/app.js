angular.module("ngApp", ["ngPhotoGrid"])
angular.module("ngApp").controller("indexCtrl", ["$scope", function($scope){

  //show loading mark while grid is building
  $scope.isBuildingGrid = true;

  // production test
  // img1 = {original_url: "http://lorempixel.com/1366/768"};
  // img2 = {original_url: "http://lorempixel.com/316/316"};
  // img3 = {original_url: "http://lorempixel.com/400/200"};
  // img4 = {original_url: "http://lorempixel.com/600/1000"};
  // img5 = {original_url: "http://lorempixel.com/600/800"};
  // img6 = {original_url: "http://lorempixel.com/800/600"};
  // img7 = {original_url: "http://lorempixel.com/800/800"};
  // img8 = {original_url: "http://lorempixel.com/900/1000"};

  // local dev
  img1 = {original_url: "images/1366x768.jpg"};
  img2 = {original_url: "images/316x316.jpg"};
  img3 = {original_url: "images/600x1000.jpg"};
  img4 = {original_url: "images/900x1000.jpg"};
  img5 = {original_url: "images/600x800.jpg"};
  img6 = {original_url: "images/800x600.jpg"};
  img7 = {original_url: "images/800x800.jpg"};
  img8 = {original_url: "images/900x1000.jpg"};

  var sources             = [img1, img2, img3, img4, img5, img6, img7, img8]

  $scope.rand             = function(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }

  $scope.clickHandler     = function(image) {
    alert(JSON.stringify(image))
  }

  $scope.buildCompletedHandler = function() {
    console.log ("built completed!")
    $scope.isBuildingGrid = false;
    $scope.$apply()
  }

  $scope.getSelectedSeeds = function() {
    var photoNumbers      = $scope.rand(2, 7)
    var seeds             = []
    var arr               = []
    while(arr.length < photoNumbers){
      var randomnumber    = $scope.rand(1, 8);
      var found           = false;
      for(var i = 0; i < arr.length; i++){
        if(arr[i] == randomnumber ){
          found           = true;
          break;
        }
      }
      if(!found) {
        arr[arr.length]   = randomnumber;
        seeds.push(sources[randomnumber])
      }
    }
    return seeds;
  }

  $scope.images              = sources.slice(0, 7);

  /**
   * Options definitions
   *----------------------*/
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
    maxLength   :     $scope.rand(2, 7)
  }

}])