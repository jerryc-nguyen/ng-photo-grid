angular.module("ngPhotoGrid", [])
angular.module("ngPhotoGrid")
  .directive("ngPhotoGrid", ["$templateCache", function($templateCache){

    $templateCache.put("photo_grid.html",
      "<div class='photo-grid-wrapper' ng-style = 'parentStyle'><span class='grid-cell' ng-repeat= 'image in loadedImages track by $index' ng-style = 'image.cellStyle' ng-click='cellClicked(image)'><img class='grid-cell-image' ng-src='{{image.original_url}}' alt='#'/></span></div>");

    function linker(scope, element, attrs) {

      scope.loadedImages   = [];
      loadedTakenImages    = [];
      takenImages          = [];

      // ###OPTIONS
      scope.defaultOptions =  {
                                urlKey          :     "original_url",
                                sortByKey       :     "nth",
                                onClicked       :     function() {},
                                onBuilded       :     function() {},
                                margin          :     2,
                                maxLength       :     7,
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

      scope.parentStyle = { width: GRID_WIDTH + "px", overflow: "hidden" }
      commonStyle       = {
                            display:        'block',
                            overflow:       'hidden',
                            cssFloat:       'left',
                            cursor:         'pointer'
                          };

      //callback handler
      scope.cellClicked = function(image) {
        scope.defaultOptions.onClicked(image)
      }

      /**
      * choose images from the url source to build grid
      * take maximum 7 images for best looking
      *------------------------------------------------*/
      chooseImages = function() {
        angular.forEach(scope.images, function(image, index) {
          var randNumber; //set the id and nth value for image if does not have
          randNumber                = randomNumber();
          image.id                  = image.id || randNumber;
          image[scope.defaultOptions.sortByKey]  = image[scope.defaultOptions.sortByKey] || randNumber;
        });

        sortedImages = scope.images.sort(function(a, b) {
          return a[scope.defaultOptions.sortByKey] - b[scope.defaultOptions.sortByKey]
        })

        return sortedImages.slice(0, scope.defaultOptions.maxLength)
      }

      randomNumber = function(max) {
        max = max || 999
        return Math.floor(Math.random()*max)
      }

      preloadImages = function() {
        takenImages = chooseImages()

        angular.forEach(takenImages, function(image, index) {
          var img;
          img                     = new Image();
          img.id                  = image.id ;
          img[scope.defaultOptions.sortByKey]  = image[scope.defaultOptions.sortByKey];

          img.onload              = function(loadedImage) {
            loadedTakenImages.push(loadedImage);

            // store the original dimesion of image
            image.naturalWidth    = loadedImage.target.naturalWidth
            image.naturalHeight   = loadedImage.target.naturalHeight

            // build the grid immediatly after the image was loaded
            // building while images loading
            if(scope.defaultOptions.buildOnLoading) {
              buildPhotoGrid();
            }
            
            if(loadedTakenImages.length == takenImages.length) {
              //trigger build completed handler
              scope.defaultOptions.onBuilded()

              //grid also can be build after all image loaded
              //all image would be shown correctly, loading time cause poor UX
              if(!scope.defaultOptions.buildOnLoading) {
                buildPhotoGrid()
              }
            }
          };

          img.src = image[scope.defaultOptions.urlKey];
        });
      };

      buildPhotoGrid = function() {
        var firstImage, imageStyle, smallCellHeight,
        smallCellWidth, firstRatio, bigCellWidth, cellCount, is2first;

        // get cell style & builded options
        styles          = getCellStyles();
        smallCellHeight = styles.options.smallCellHeight;
        smallCellWidth  = styles.options.smallCellWidth;
        firstRatio      = styles.options.firstRatio;
        bigCellWidth    = styles.options.bigCellWidth;
        bigCellHeight   = styles.options.bigCellHeight;
        cellCount       = styles.options.cellCount;
        is2First        = styles.options.is2First;

        angular.forEach(takenImages, function(image, index) {
          var curHeight, curRatio, imageStyle;
          curRatio      = (image.naturalWidth / image.naturalHeight);
          curHeight     = smallCellWidth / curRatio;
          imageStyle    = {}

          //positioning the image in the small cell for better look
          var marginTop, imageStyle;

          // only positioning the small cell
          // if(index != 0) {
          //   if(curHeight > smallCellHeight) { //when height > smallCellHeight
          //     marginTop             = (curHeight - smallCellHeight) / 2;
          //     imageStyle.marginTop  = "-" + marginTop + "px";
          //   } else {
          //     // scale up the image when the curHeight = smallCellHeight
          //     imageStyle.height     = smallCellHeight + "px";
          //     imageStyle.width      = smallCellHeight * curRatio + "px"
          //     marginLeft            = (smallCellHeight * curRatio - smallCellWidth) / 2
          //     imageStyle.marginLeft = "-" + marginLeft + "px";
          //   }
          // } else if (index == 0 && curRatio >= 1
          //           && (image.naturalWidth < bigCellWidth || image.naturalWidth < GRID_WIDTH)) {

          //   //if the natural width of image were too small, we would scale it up to parent's wrap
          //   imageStyle.width  = "100%";
          // }

          // set image cell has max height or max width
          // if(curHeight < smallCellHeight) {
          //   imageStyle.maxHeight  = "100%";
          // } else {
          //   imageStyle.maxWidth   = "100%";
          // }

          if (is2First) { //case the grid has 2 image big first
            var bigCellStyle, smallCellStyle;
            bigCellStyle          = angular.copy(styles.big);
            smallCellStyle        = angular.copy(styles.small);
            if (index == 0) {
              bigCellStyle.top    = "0";
              image.cellStyle     = bigCellStyle;
            } else if (index  == 1) {
              bigCellStyle.top    = bigCellHeight + MARGIN + "px";
              image.cellStyle     = bigCellStyle;
            } else {
              var margin, smallCellIndex;
              smallCellIndex      = index - 2;
              margin              = smallCellIndex == 0 ? 0 : MARGIN;
              smallCellStyle.top  = smallCellIndex * smallCellHeight + (margin * smallCellIndex) + "px"
              image.cellStyle     = smallCellStyle
            }

            //override image style to fit this case.
            // if (curRatio > 0.8 && curRatio < 1.2) {
            //   imageStyle.width      = "auto";
            //   imageStyle.maxHeight  = "100%";
            //   imageStyle.maxWidth   = "auto";
            //   imageStyle.marginTop  = "0px";
            // } else if(curRatio >= 2) {
            //   if (index < 2) {
            //     imageStyle.width      = "100%";
            //     imageStyle.height     = "auto";
            //     imageStyle.margin     = "0";
            //   } else {
            //     //@todo need implement!
            //   }

            // }

          } else if (index == 0) { //big cell style
            image.cellStyle = styles.big;

          } else if (index != cellCount - 1 || cellCount == 2){ //small cells
            image.cellStyle = styles.small;

          } else { //last small cell style (remove redundant margin right or bottom)
            image.cellStyle = styles.last;
          }
          //apply the style for image in cell
          image.imageStyle = imageStyle
        })

        // apply the binding, display the grid in view
        scope.loadedImages = takenImages;
      }

      /**
      * build cell style for grid
      * @firstRatio   : ratio of the first image in list
      * @secondRatio  : ratio of the second image in list
      * @cellCount    : total cells in grid
      *------------------------------------------------*/
      buildCellStyle      = function (firstImage, secondImage, cellCount) {
        var firstRatio, secondRatio, bigCellStyle, smallCellStyle, lastCellStyle,
            WIDTH_RATE, bigCellWidth, bigCellHeight, smallCellHeight, smallCellWidth, is2First;

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
          var marginSize              = MARGIN / cellCount;
          bigCellStyle.marginRight    = marginSize;
          smallCellStyle.marginLeft   = marginSize;

          bigCellWidth          = Math.floor(GRID_WIDTH * WIDTH_RATE) - MARGIN;
          bigCellStyle.width    = bigCellWidth;
          bigCellStyle.height   = bigCellWidth / firstRatio;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = GRID_WIDTH - bigCellWidth - MARGIN;
          smallCellHeight       = bigCellWidth / firstRatio;
          smallCellStyle.width  = smallCellWidth;
          smallCellStyle.height = smallCellHeight;
        }

        // add style for first column contain 2 big images, only support for grid has more than 5 cells
        else if (cellCount >= 5 && (case2BigImage1 || case2BigImage2)) {
          var GRID_HEIGHT;
          WIDTH_RATE            = case2BigImage1 ? 1/2 : 2/3;
          scope.parentStyle.position = "relative";
          bigCellStyle.cssFloat = smallCellStyle.cssFloat = lastCellStyle.cssFloat = null;
          bigCellStyle.position = smallCellStyle.position = lastCellStyle.position = "absolute";

          //determine the height of the big cell
          //height == width / 2 if the grid in case2BigImage1
          if(case2BigImage1) {
            bigCellHeight = GRID_WIDTH / 2
          } else {
            bigCellHeight  = WIDTH_RATE * GRID_WIDTH / firstRatio
          }

          GRID_HEIGHT               = bigCellHeight * 2 + MARGIN; //margin bottom the first big image
          scope.parentStyle.height  = GRID_HEIGHT + "px";

          bigCellWidth              = GRID_WIDTH * WIDTH_RATE - MARGIN;
          bigCellStyle.width        = bigCellWidth;
          bigCellStyle.height       = bigCellHeight;
          bigCellStyle.left         = 0;

          smallCellWidth            = smallCellWidth        = GRID_WIDTH - bigCellWidth;
          smallCellHeight           = (GRID_HEIGHT / (cellCount - 2)) - MARGIN;
          smallCellStyle.width      = smallCellWidth;
          smallCellStyle.height     = smallCellHeight;
          smallCellStyle.right      = (-1) * MARGIN;

          is2First                  = true; //flag this style is has 2 big image style

        } else if(firstRatio > 1) { //build style for grid more than 2 images and first image has firstRatio > 1
          bigCellStyle.marginBottom  = MARGIN;
          smallCellStyle.marginRight = MARGIN;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = ( GRID_WIDTH - smallCellCount * MARGIN ) / smallCellCount;
          smallCellStyle.width  = smallCellWidth;
          
          if(IS_SQUARE) {
            bigCellStyle.height   = GRID_WIDTH * 2 / 3;
            bigCellStyle.width    = bigCellStyle.height * firstRatio;
            smallCellStyle.height = GRID_WIDTH * 1 / 3 - MARGIN;
          } else {
            bigCellStyle.width    = GRID_WIDTH;
            bigCellStyle.height   = GRID_WIDTH / firstRatio;
            smallCellWidth        = ( GRID_WIDTH - smallCellCount * MARGIN ) / smallCellCount;
            
            // determine the height of smallCell below
            if (firstRatio > 1.3 && firstRatio < 1.5) { // 4:3 < firstRatio < 5:3
              smallCellHeight     = smallCellWidth / firstRatio;
            } else if (firstRatio > 1.5) {
              smallCellHeight     = smallCellWidth / 1.5
            } else {
              smallCellHeight     = smallCellWidth;
            }
            smallCellStyle.height = smallCellHeight;
          }
          lastCellStyle.height  = smallCellStyle.height
        } else { //build style for grid more than 2 images and first image has firstRatio <= 1
          bigCellStyle.marginRight       = MARGIN;
          smallCellStyle.marginBottom    = MARGIN;

          if (IS_SQUARE) {
            bigCellHeight   = GRID_WIDTH
            bigCellWidth    = GRID_WIDTH * WIDTH_RATE
          } else {
            bigCellWidth    = Math.floor(GRID_WIDTH * WIDTH_RATE) ;
            bigCellHeight   = bigCellWidth / firstRatio;
          }

          bigCellStyle.width    = bigCellWidth;
          bigCellStyle.height   = bigCellHeight;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = GRID_WIDTH - bigCellWidth - MARGIN;
          smallCellHeight       = bigCellHeight / smallCellCount - MARGIN

          smallCellStyle.width  = smallCellWidth;
          smallCellStyle.height = smallCellHeight
          lastCellStyle.width   = smallCellWidth
        }

        console.log("bigCellStyle", bigCellStyle)
        return {
          big:    bigCellStyle,
          small:  smallCellStyle,
          last:   lastCellStyle,
          options:  {
            firstRatio:       firstRatio,
            smallCellWidth:   smallCellWidth,
            smallCellHeight:  smallCellHeight,
            bigCellWidth:     bigCellWidth,
            bigCellHeight:    bigCellHeight,
            cellCount:        cellCount,
            is2First:         is2First
          } //keep these values to style cell image after building style for cell link
        }
      }

      getWidthRate      = function(firstRatio, cellCount) {
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

      getCellStyles     = function() {
        var margin, firstImage, secondImage, cellCount, bigCellStyle,
            smallCellStyle, smallCellCount, firstRatio, secondRatio, smallCellWidth, smallCellHeight,
            bigCellWidth, WIDTH_RATE, buildedStyle;

        firstImage            = takenImages[0];
        secondImage           = takenImages[1];
        cellCount             = takenImages.length;

        if (cellCount == 1) { //build style for only one image
          //@todo need implement!
        } else { //build style for >=2 images
          buildedStyle        = buildCellStyle(firstImage, secondImage, cellCount)
        }

        console.log("buildedStyle", buildedStyle)

        // remove margin right of last small cell in the bottom
        if(buildedStyle.small.marginRight) {
          buildedStyle.last.marginRight     = 0
          buildedStyle.last.width           = buildedStyle.small.width + MARGIN;
        }

        // remove margin bottom of last small cell in the right
        if(buildedStyle.small.marginBottom) {
          buildedStyle.last.marginBottom    = 0
          buildedStyle.last.height          = buildedStyle.small.height + MARGIN;
        }

        // add suffix px for margin and size for ng-style working
        attrs = ["width", "height", "marginRight", "marginLeft", "marginBottom", "left", "right"]
        angular.forEach(attrs, function(attr, index) {
          if(buildedStyle.big[attr]) {
            buildedStyle.big[attr]         += "px"
          }
          if(buildedStyle.small[attr]) {
            buildedStyle.small[attr]       += "px"
          }
          if(buildedStyle.last[attr]) {
            buildedStyle.last[attr]        += "px"
          }
        })

        return buildedStyle;
      }

      //functions call when init
      preloadImages();
    }

    return {
      restrict:       "A",
      templateUrl:    "photo_grid.html",
      scope: {
        images:       "=images",
        gridOptions:  "=gridOptions"
      },
      link: linker
    }



  }])
