/**
 * Author: Nhan Nguyen <jerryc.nguyen92@gmail.com>
 * https://github.com/jerryc-nguyen/ng-photo-grid
 * MIT License
 */
angular.module("ngPhotoGrid", [])
angular.module("ngPhotoGrid")
  .filter("photoUrlSafe", [
    "$sce", function($sce) {
      return function(text) {
        return $sce.trustAsResourceUrl(text);
      };
    }
  ])
  .directive('endRepeat', function() {
    return {
      restrict: 'A',
      require: "^ngPhotoGrid",
      link: function(scope, element, attrs, gridController) {
        if (scope.$last) {
          gridController.notifyDOMReady(element)
        }
      }
    };
  })
  .directive("ngPhotoGrid", ["$templateCache", function($templateCache){

    $templateCache.put("photo_grid.html",
      "<ul class='photo-grid-wrapper' ng-style = 'parentStyle'><li class='grid-cell' ng-repeat= 'image in loadedImages track by $index' ng-style = 'image.cellStyle' ng-click='cellClicked(image)' end-repeat='' ng-attr-data-src='{{image[defaultOptions.urlKey] | photoUrlSafe}}'><img class='grid-cell-image' ng-style = 'image.imageStyle' ng-src='{{image[defaultOptions.urlKey]}}' alt='#'/></li></ul>");

    function linker(scope, element, attrs) {
      scope.loadedImages      = [];
      scope.loadedTakenImages = [];
      scope.takenImages       = [];

      // ###OPTIONS
      scope.defaultOptions =  {
                                urlKey          :     "original_url",
                                sortByKey       :     "nth",
                                onClicked       :     function() {},
                                onBuilded       :     function() {},
                                onDOMReady      :     function() {},
                                margin          :     2,
                                maxLength       :     5,
                                isSquare        :     false,
                                buildOnLoading  :     true
                              }

      angular.extend(scope.defaultOptions, scope.gridOptions);

      var IS_SQUARE    = scope.defaultOptions.isSquare;
      var GRID_WIDTH   = element.prop('offsetWidth');
      var MARGIN       = scope.defaultOptions.margin;

      if (!GRID_WIDTH) { // set the default width of parent
        GRID_WIDTH = 250
      }

      scope.parentStyle = { width: GRID_WIDTH + "px", overflow: "hidden", position: "relative", margin: 0, padding: 0 }

      if(IS_SQUARE) {
        scope.parentStyle.height = GRID_WIDTH + "px";
      }

      var commonStyle = {
                      display:        'block',
                      overflow:       'hidden',
                      cssFloat:       'left',
                      cursor:         'pointer',
                      position:       'relative'
                    };

      //callback handler
      scope.cellClicked = function(image) {
        scope.defaultOptions.onClicked(image);
      }

      /**
      * choose images from the url source to build grid
      * take maximum 7 images for best looking
      *------------------------------------------------*/
      scope.chooseImages = function(images) {
        angular.forEach(images, function(image, index) {
          var randNumber; //set the id and nth value for image if does not have
          randNumber                = randomNumber();
          image.id                  = image.id || randNumber;
          image[scope.defaultOptions.sortByKey]  = image[scope.defaultOptions.sortByKey] || randNumber;
        });

        var sortedImages = images.sort(function(a, b) {
          return a[scope.defaultOptions.sortByKey] - b[scope.defaultOptions.sortByKey]
        })

        return sortedImages.slice(0, scope.defaultOptions.maxLength)
      }

      randomNumber = function(max) {
        max = max || 999;
        return Math.floor(Math.random()*max);
      }

      scope.preloadImages = function(images) {
        scope.takenImages = scope.chooseImages(images)

        angular.forEach(scope.takenImages, function(image, index) {
          var img;
          img                     = new Image();
          img.id                  = image.id ;
          img[scope.defaultOptions.sortByKey]  = image[scope.defaultOptions.sortByKey];

          img.onload              = function(loadedImage) {
            scope.loadedTakenImages.push(loadedImage);

            // store the original dimesion of image
            image.naturalWidth    = loadedImage.target.naturalWidth
            image.naturalHeight   = loadedImage.target.naturalHeight

            // build the grid immediatly after the image was loaded
            // building while images loading
            if(scope.defaultOptions.buildOnLoading) {
              scope.buildPhotoGrid();
              setTimeout(function() {
                scope.$apply()
              }, 10)
            }
            
            if(scope.loadedTakenImages.length == scope.takenImages.length) {   
              //trigger build completed handler
              scope.defaultOptions.onBuilded(element)
   
              //grid also can be build after all image loaded
              //all image would be shown correctly, loading time cause poor UX
              if(!scope.defaultOptions.buildOnLoading) {
                scope.buildPhotoGrid()
                setTimeout(function() {
                  scope.$apply()
                }, 15)
              }
            }
            
          };
          img.src = image[scope.defaultOptions.urlKey];
        });
      };

      scope.buildPhotoGrid = function() {
        var firstImage, imageStyle, smallCellHeight,
        smallCellWidth, bigCellWidth, bigCellHeight, cellCount, is2First;

        // get cell style & builded options
        styles          = scope.getCellStyles();
        smallCellHeight = styles.options.smallCellHeight;
        smallCellWidth  = styles.options.smallCellWidth;
        bigCellWidth    = styles.options.bigCellWidth;
        bigCellHeight   = styles.options.bigCellHeight;
        cellCount       = styles.options.cellCount;
        is2First        = styles.options.is2First;

        scope.loadedImages = []
        angular.forEach(scope.takenImages, function(image, index) {
          if (is2First) { //case the grid has 2 image big first
            var bigCellStyle, smallCellStyle;
            bigCellStyle          = angular.copy(styles.big);
            smallCellStyle        = angular.copy(styles.small);
            if (index == 0) {
              bigCellStyle.top    = "0";
              image.cellStyle     = bigCellStyle;
              image.imageStyle = getImageStyle(bigCellWidth, bigCellHeight, image);
            } else if (index  == 1) {
              bigCellStyle.top    = bigCellHeight + MARGIN + "px";
              image.cellStyle     = bigCellStyle;
              image.imageStyle = getImageStyle(bigCellWidth, bigCellHeight, image);
            } else {
              var margin, smallCellIndex;

              // fix the last cell of 2 first was not fit the grid height
              if(index == scope.takenImages.length - 1) {
                smallCellStyle.height = smallCellHeight + MARGIN + "px"
              }

              smallCellIndex      = index - 2;
              margin              = smallCellIndex == 0 ? 0 : MARGIN;
              smallCellStyle.top  = smallCellIndex * smallCellHeight + (margin * smallCellIndex) + "px";
              image.cellStyle     = smallCellStyle;
              image.imageStyle    = getImageStyle(smallCellWidth, smallCellHeight, image);


            }
          } else if (index == 0) { //big cell style
            image.cellStyle = styles.big;
            image.imageStyle = getImageStyle(bigCellWidth, bigCellHeight, image);
          } else if (index != cellCount - 1 || cellCount == 2){ //small cells
            image.cellStyle = styles.small;
            image.imageStyle = getImageStyle(smallCellWidth, smallCellHeight, image);
          } else { //last small cell style (remove redundant margin right or bottom)
            image.imageStyle = getImageStyle(smallCellWidth, smallCellHeight, image);
            image.cellStyle = styles.last;
          }
        })
        scope.loadedImages = scope.takenImages;
      }

      function getImageStyle(cellWidth, cellHeight, image) {
        var imageWidth, imageHeight, curImageWidth, curImageHeight, imgRatio, cellRatio;

        cellWidth  = Math.round(cellWidth);
        cellHeight = Math.round(cellHeight);
        imageWidth  = image.naturalWidth;
        imageHeight = image.naturalHeight;
        imgRatio  = imageWidth / imageHeight;
        cellRatio = cellWidth / cellHeight;

        // when the any image's dimension greater than cell's dimension
        if(cellWidth > imageWidth || cellHeight > imageHeight) {
          if (cellWidth >= imageWidth) {
            return getSmallImagePortraitStyle(cellHeight, cellWidth, imgRatio);
          } else {
            return getSmallImageLandscapeStyle(cellHeight, cellWidth, imgRatio);
          }
        } else { // when the image smaller than the cell in both dimension
          if(imgRatio >= 1) {
            return getSmallImageLandscapeStyle(cellHeight, cellWidth, imgRatio);
          } else {
            return getSmallImagePortraitStyle(cellHeight, cellWidth, imgRatio);
          }
        }
      }

      function getSmallImageLandscapeStyle(cellHeight, cellWidth, imgRatio) {
        var curImageWidth = cellWidth;
        var curImageHeight = Math.round(curImageWidth  / imgRatio);
        if(curImageHeight >= cellHeight) {
          var top = (-1) * Math.round((cellWidth / imgRatio - cellHeight) / 2);
          if(curImageWidth < cellWidth) {
            return { width: "100%", position: "relative", top: top + "px"}
          } else {
            return { maxWidth: "100%", position: "relative", top: top + "px"}
          }
        } else {
          var left = (-1) * Math.round((cellHeight * imgRatio - cellWidth) / 2);
          return { maxHeight: "100%", height: "100%", position: "relative", left: left + "px"}
        }
      }
          
      function getSmallImagePortraitStyle(cellHeight, cellWidth, imgRatio) {
        var curImageHeight = cellHeight;
        var curImageWidth = Math.round(curImageHeight  * imgRatio);
        var top = (-1) * Math.round((cellWidth / imgRatio - cellHeight) / 2);
        var left = (-1) * Math.round((cellHeight * imgRatio - cellWidth) / 2);
        if(curImageWidth <= cellWidth) {
          return { width: "100%", position: "relative", top: top + "px"}
        } else {
          return { maxHeight: "100%", height: "100%", position: "relative", left: left + "px"} 
        }
      }

      /**
      * build cell style for grid
      * @firstRatio   : ratio of the first image in list
      * @secondRatio  : ratio of the second image in list
      * @cellCount    : total cells in grid
      *------------------------------------------------*/
      buildCellStyle      = function (firstImage, secondImage, cellCount) {
        var firstRatio, secondRatio, bigCellStyle, smallCellStyle, lastCellStyle,
            WIDTH_RATE, bigCellWidth, bigCellHeight, smallCellHeight, smallCellWidth, is2First, 
            case2BigImage1, case2BigImage2;

        firstRatio              = firstImage.naturalWidth / firstImage.naturalHeight;

        if (secondImage)
          secondRatio           = secondImage.naturalWidth / secondImage.naturalHeight;
        else
          secondRatio           = 1.5 //fail all cases below

        bigCellStyle            = angular.copy(commonStyle);
        smallCellStyle          = angular.copy(commonStyle);
        lastCellStyle           = angular.copy(commonStyle);
        WIDTH_RATE              = getWidthRate(firstRatio, cellCount);
        case2BigImage1          = firstRatio  > 0.8 && firstRatio  < 1.2 &&
                                  secondRatio > 0.8 && secondRatio < 1.2
        case2BigImage2          = firstRatio >= 2 && secondRatio >= 2

        if(cellCount == 2) { //build style for grid has 2 images and first image has firstRatio > 1

          if(firstRatio >= 1) {
            bigCellStyle.marginBottom = MARGIN;
            bigCellStyle.width    = GRID_WIDTH;
            bigCellStyle.height   = GRID_WIDTH / 2;
            smallCellStyle.width  = GRID_WIDTH;
            smallCellStyle.height = GRID_WIDTH / 2 - MARGIN;
          } else {
            var marginSize              = MARGIN / cellCount;
            bigCellStyle.marginRight    = marginSize;
            smallCellStyle.marginLeft   = marginSize;

            if(IS_SQUARE) {
              bigCellWidth          = Math.floor(GRID_WIDTH / 2) - MARGIN;
              bigCellStyle.width    = bigCellWidth;
              bigCellStyle.height   = GRID_WIDTH;

              smallCellWidth        = Math.floor(GRID_WIDTH / 2) - MARGIN;
              smallCellStyle.width  = smallCellWidth;
              smallCellStyle.height = GRID_WIDTH;
            } else {
              bigCellWidth          = Math.floor(GRID_WIDTH * WIDTH_RATE) - MARGIN;
              bigCellStyle.width    = bigCellWidth;
              bigCellStyle.height   = bigCellWidth;

              smallCellWidth        = GRID_WIDTH - bigCellWidth - MARGIN;
              smallCellHeight       = bigCellWidth;
              smallCellStyle.width  = smallCellWidth;
              smallCellStyle.height = smallCellHeight;
            }
          }
        }

        // add style for first column contain 2 big images, only support for grid has more than 5 cells
        //NOTE: need check when 2 first were same size!!!
        else if (cellCount >= 5 && (case2BigImage1 || case2BigImage2)) {
          var GRID_HEIGHT;
          WIDTH_RATE            = case2BigImage1 ? 1/2 : 2/3;
          scope.parentStyle.position = "relative";
          bigCellStyle.cssFloat = smallCellStyle.cssFloat = lastCellStyle.cssFloat = null;
          bigCellStyle.position = smallCellStyle.position = lastCellStyle.position = "absolute";

          //determine the height of the big cell
          //height == width / 2 if the grid in case2BigImage1
          if(case2BigImage1) {
            bigCellHeight = GRID_WIDTH / 2;
          } else {
            bigCellHeight  = WIDTH_RATE * GRID_WIDTH / firstRatio;
          }

          GRID_HEIGHT               = bigCellHeight * 2 + MARGIN; //margin bottom the first big image
          scope.parentStyle.height  = GRID_HEIGHT + "px";

          bigCellStyle.width        = GRID_WIDTH * WIDTH_RATE - MARGIN;
          bigCellStyle.height       = bigCellHeight;
          bigCellStyle.left         = 0;

          smallCellStyle.width      = GRID_WIDTH - bigCellStyle.width - MARGIN;
          smallCellStyle.height     = Math.floor((GRID_HEIGHT / (cellCount - 2))) - MARGIN;
          smallCellStyle.right      = 0;

          is2First                  = true; //flag this style is has 2 big image style
          lastCellStyle.height      = smallCellStyle.height + MARGIN;

        } else if(firstRatio >= 1) { //build style for grid more than 2 images and first image has firstRatio > 1

          bigCellStyle.marginBottom  = MARGIN;
          smallCellStyle.marginRight = MARGIN;
          var smallCellCount         = cellCount - 1;
          
          if (IS_SQUARE) {
            bigCellStyle.height   = GRID_WIDTH * 2 / 3;
            bigCellStyle.width    = GRID_WIDTH;
            smallCellStyle.height = GRID_WIDTH * 1 / 3 - MARGIN;
          } else {
            bigCellStyle.width    = GRID_WIDTH ;
            bigCellStyle.height   = GRID_WIDTH * 2 / 3;
          }
          smallCellStyle.width  = ( GRID_WIDTH - smallCellCount * MARGIN ) / smallCellCount;
          // determine the height of smallCell below
          if (IS_SQUARE) {
            smallCellStyle.height = GRID_WIDTH - bigCellStyle.height - MARGIN;
          } else if (firstRatio > 1.3 && firstRatio < 1.5) { // 4:3 < firstRatio < 5:3
            smallCellStyle.height     = smallCellStyle.width / firstRatio;
          } else if (firstRatio > 1.5) {
            smallCellStyle.height     = smallCellStyle.width / 1.5;
          } else {
            smallCellStyle.height     = smallCellStyle.width;
          }
          lastCellStyle.height = smallCellStyle.height;
          lastCellStyle.width  = smallCellStyle.width;
        } else { //build style for grid more than 2 images and first image has firstRatio <= 1
          bigCellStyle.marginRight       = MARGIN;
          smallCellStyle.marginBottom    = MARGIN;

          if (IS_SQUARE) {
            bigCellHeight   = GRID_WIDTH;
            bigCellWidth    = GRID_WIDTH * WIDTH_RATE;
          } else {
            bigCellWidth    = Math.floor(GRID_WIDTH * WIDTH_RATE);
            bigCellHeight   = bigCellWidth / firstRatio;
          }

          bigCellStyle.width    = bigCellWidth;
          bigCellStyle.height   = bigCellHeight;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = GRID_WIDTH - bigCellWidth - MARGIN;
          smallCellHeight       = bigCellHeight / smallCellCount - MARGIN

          smallCellStyle.width  = GRID_WIDTH - bigCellWidth - MARGIN;
          smallCellStyle.height = smallCellHeight;
          lastCellStyle.width   = smallCellWidth;
          lastCellStyle.height  = smallCellHeight;
        }

        return {
          big:    bigCellStyle,
          small:  smallCellStyle,
          last:   lastCellStyle,
          options:  {
            firstRatio:       firstRatio,
            // keep these value because ng style need add measured suffix
            smallCellWidth:   smallCellStyle.width,
            smallCellHeight:  smallCellStyle.height,
            bigCellWidth:     bigCellStyle.width,
            bigCellHeight:    bigCellStyle.height,
            cellCount:        cellCount,
            is2First:         is2First
          } //keep these values to style cell image after building style for cell link
        }
      }

      getWidthRate = function(firstRatio, cellCount) {
        if (cellCount == 2) { //build style for 2 images
          if(firstRatio > 1) {
            return 2/3;
          } else {
            return 1/2;
          }
        } else if(firstRatio > 1) { //build style for >= 3 images, first image has firstRatio > 1
          return 1
        } else { //build style for >= 3 images, first image has firstRatio < 1
          return 2/3
        }
      }

      scope.getCellStyles     = function() {
        var firstImage, secondImage, cellCount, buildedStyle;

        firstImage            = scope.takenImages[0];
        secondImage           = scope.takenImages[1];
        cellCount             = scope.takenImages.length;

        if (cellCount == 1) { //build style for only one image
          //@todo need implement!
        } else { //build style for >=2 images
          buildedStyle        = buildCellStyle(firstImage, secondImage, cellCount);
        }

        // remove margin right of last small cell in the bottom
        if(buildedStyle.small.marginRight) {
          buildedStyle.last.marginRight     = 0;
          buildedStyle.last.width           = buildedStyle.small.width + MARGIN;
        }

        // remove margin bottom of last small cell in the right
        if(buildedStyle.small.marginBottom) {
          buildedStyle.last.marginBottom    = 0;
          buildedStyle.last.height          = buildedStyle.small.height + MARGIN;
        }

        // add suffix px for margin and size for ng-style working
        var attrs = ["width", "height", "marginRight", "marginLeft", "marginBottom", "left", "right"];
        angular.forEach(attrs, function(attr, index) {
          if(buildedStyle.big[attr]) {
            buildedStyle.big[attr]   += "px";
          }
          if(buildedStyle.small[attr]) {
            buildedStyle.small[attr] += "px";
          }
          if(buildedStyle.last[attr]) {
            buildedStyle.last[attr]  += "px";
          }
        })

        return buildedStyle;
      }

      //trigger build grid
      scope.$watch("images", function(images) {
        if(images && images.length > 0) {
          scope.preloadImages(images);
        }
      })
    }

    return {
      restrict:       "A",
      templateUrl:    "photo_grid.html",
      scope: {
        images:       "=",
        gridOptions:  "="
      },
      controller: ["$scope", "$element", function($scope, $element) {
        this.notifyDOMReady = function() {
          $scope.defaultOptions.onDOMReady($element)
        }
      }],
      link: linker
    }

  }])
