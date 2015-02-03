angular.module("ngPhotoGrid", [])
angular.module("ngPhotoGrid")
  .directive("ngPhotoGrid", ["$templateCache", function($templateCache){

    $templateCache.put("photo_grid.html",
      "<div class='photo-grid-wrapper' ng-style = 'parentStyle'><a href='#' class='grid-cell' ng-repeat= 'image in loadedImages track by $index' ng-style = 'image.cellStyle' ng-click='cellClicked(image)'><img class='grid-cell-image' ng-style='image.imageStyle' ng-src='{{image.original_url}}' alt='#'/></a></div>");

    function linker(scope, element, attrs) {

      scope.loadedImages        = [];
      scope.loadedTakenImages   = [];
      scope.takenImages         = [];

      // ###OPTIONS
      scope.defaultOptions      = {
                                    urlKey        :     "original_url",
                                    sortByKey     :     "nth",
                                    onClicked     :     function() {},
                                    onBuilded     :     function() {},
                                    margin        :     2,
                                    maxLength     :     7
                                  }

      angular.extend(scope.defaultOptions, scope.gridOptions);

      scope.URL_KEY             = scope.defaultOptions.urlKey;
      scope.SORT_BY_KEY         = scope.defaultOptions.sortByKey;
      scope.GRID_WIDTH          = element.prop('offsetWidth');
      scope.MARGIN              = scope.defaultOptions.margin;
      scope.MAX_LENGTH          = scope.defaultOptions.maxLength;

      if (!scope.GRID_WIDTH || scope.GRID_WIDTH < 320) { // set the default width of parent
        scope.GRID_WIDTH       = 320
      }
      scope.parentStyle         = { width: scope.GRID_WIDTH + "px", overflow: "hidden" }
      scope.commonStyle         = {
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
      scope.chooseImages = function() {
        angular.forEach(scope.images, function(image, index) {
          var randNumber; //set the id and nth value for image if does not have
          randNumber                = scope.randomNumber();
          image.id                  = image.id || randNumber;
          image[scope.SORT_BY_KEY]  = image[scope.SORT_BY_KEY] || randNumber;
        });

        sortedImages = scope.images.sort(function(a, b) {
          return a[scope.SORT_BY_KEY] - b[scope.SORT_BY_KEY]
        })

        return sortedImages.slice(0, scope.MAX_LENGTH)
      }

      scope.randomNumber = function(max) {
        max = max || 999
        return Math.floor(Math.random()*max)
      }

      scope.preloadImages = function() {
        scope.takenImages = scope.chooseImages()

        angular.forEach(scope.takenImages, function(image, index) {
          var img;
          img                     = new Image();
          img.id                  = image.id ;
          img[scope.SORT_BY_KEY]  = image[scope.SORT_BY_KEY];

          img.onload              = function(loadedImage) {
            scope.loadedTakenImages.push(loadedImage);

            // store the original dimesion of image
            image.naturalWidth    = loadedImage.target.naturalWidth
            image.naturalHeight   = loadedImage.target.naturalHeight

            // build the grid immediatly after the image was loaded
            // image was shown and grid was built while image loading
            // @todo make this configurable
            scope.buildPhotoGrid();

            if(scope.loadedTakenImages.length == scope.takenImages.length) {
              //trigger build completed handler
              scope.defaultOptions.onBuilded()

              //grid also can be build after all image loaded
              //all image would be shown correctly, loading time cause poor UX
              //scope.buildPhotoGrid()
            }
          };

          img.src                 = image[scope.URL_KEY];
        });
      };

      scope.buildPhotoGrid = function() {
        var firstImage, imageStyle, smallCellHeight,
        smallCellWidth, firstRatio, bigCellWidth, cellCount, is2first;

        // get cell style & builded options
        styles          = scope.getCellStyles();
        smallCellHeight = styles.options.smallCellHeight;
        smallCellWidth  = styles.options.smallCellWidth;
        firstRatio      = styles.options.firstRatio;
        bigCellWidth    = styles.options.bigCellWidth;
        bigCellHeight   = styles.options.bigCellHeight;
        cellCount       = styles.options.cellCount;
        is2First        = styles.options.is2First;

        angular.forEach(scope.takenImages, function(image, index) {
          var curHeight, curRatio, imageStyle;
          curRatio      = (image.naturalWidth / image.naturalHeight);
          curHeight     = smallCellWidth / curRatio;
          imageStyle    = {}

          //positioning the image in the small cell for better look
          var marginTop, imageStyle;

          // only positioning the small cell
          if(index != 0) {
            if(curHeight > smallCellHeight) { //when height > smallCellHeight
              marginTop             = (curHeight - smallCellHeight) / 2;
              imageStyle.marginTop  = "-" + marginTop + "px";
            } else {
              // scale up the image when the curHeight = smallCellHeight
              imageStyle.height     = smallCellHeight + "px";
              imageStyle.width      = smallCellHeight * curRatio + "px"
              marginLeft            = (smallCellHeight * curRatio - smallCellWidth) / 2
              imageStyle.marginLeft = "-" + marginLeft + "px";
            }
          } else if (index == 0 && curRatio >= 1
                    && (image.naturalWidth < bigCellWidth || image.naturalWidth < scope.GRID_WIDTH)) {

            //if the natural width of image were too small, we would scale it up to parent's wrap
            imageStyle.width  = "100%";
          }

          // set image cell has max height or max width
          if(curHeight < smallCellHeight) {
            imageStyle.maxHeight  = "100%";
          } else {
            imageStyle.maxWidth   = "100%";
          }

          if (is2First) { //case the grid has 2 image big first
            var bigCellStyle, smallCellStyle;
            bigCellStyle          = angular.copy(styles.big);
            smallCellStyle        = angular.copy(styles.small);
            if (index == 0) {
              bigCellStyle.top    = "0";
              image.cellStyle     = bigCellStyle;
            } else if (index  == 1) {
              bigCellStyle.top    = bigCellHeight + scope.MARGIN + "px";
              image.cellStyle     = bigCellStyle;
            } else {
              var margin, smallCellIndex;
              smallCellIndex      = index - 2;
              margin              = smallCellIndex == 0 ? 0 : scope.MARGIN;
              smallCellStyle.top  = smallCellIndex * smallCellHeight + (margin * smallCellIndex) + "px"
              image.cellStyle     = smallCellStyle
            }

            //override image style to fit this case.
            if (curRatio > 0.8 && curRatio < 1.2) {
              imageStyle.width      = "auto";
              imageStyle.maxHeight  = "100%";
              imageStyle.maxWidth   = "auto";
              imageStyle.marginTop  = "0px";
            } else if(curRatio >= 2) {
              if (index < 2) {
                imageStyle.width      = "100%";
                imageStyle.height     = "auto";
                imageStyle.margin     = "0";
              } else {
                //@todo need implement!
              }

            }

          } else if (index == 0) { //big cell style
            image.cellStyle     = styles.big;

          } else if (index != cellCount - 1 || cellCount == 2){ //small cells
            image.cellStyle     = styles.small;

          } else { //last small cell style (remove redundant margin right or bottom)
            image.cellStyle     = styles.last;
          }

          //apply the style for image in cell
          image.imageStyle        = imageStyle

        })

        // apply the binding, display the grid in view
        scope.loadedImages      = scope.takenImages;
        scope.$apply()
      }

      /**
      * build cell style for grid
      * @firstRatio   : ratio of the first image in list
      * @secondRatio  : ratio of the second image in list
      * @cellCount    : total cells in grid
      *------------------------------------------------*/
      scope.buildCellStyle      = function (firstImage, secondImage, cellCount) {
        var firstRatio, secondRatio, bigCellStyle, smallCellStyle, lastCellStyle,
            WIDTH_RATE, bigCellWidth, bigCellHeight, smallCellHeight, smallCellWidth, is2First;

        firstRatio              = firstImage.naturalWidth / firstImage.naturalHeight;
        if (secondImage)
          secondRatio           = secondImage.naturalWidth / secondImage.naturalHeight;
        else
          secondRatio           = 1.5 //fail all cases below

        bigCellStyle            = angular.copy(scope.commonStyle);
        smallCellStyle          = angular.copy(scope.commonStyle);
        lastCellStyle           = angular.copy(scope.commonStyle);
        WIDTH_RATE              = scope.getWidthRate(firstRatio, cellCount);
        case2BigImage1          = firstRatio  > 0.8 && firstRatio  < 1.2 &&
                                  secondRatio > 0.8 && secondRatio < 1.2
        case2BigImage2          = firstRatio >= 2 && secondRatio >= 2

        if(cellCount == 2) { //build style for grid has 2 images and first image has firstRatio > 1
          var marginSize              = scope.MARGIN / cellCount;
          bigCellStyle.marginRight    = marginSize;
          smallCellStyle.marginLeft   = marginSize;

          bigCellWidth          = Math.floor(scope.GRID_WIDTH * WIDTH_RATE) - scope.MARGIN;
          bigCellStyle.width    = bigCellWidth;
          bigCellStyle.height   = bigCellWidth / firstRatio;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = scope.GRID_WIDTH - bigCellWidth - scope.MARGIN;
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
            bigCellHeight = scope.GRID_WIDTH / 2
          } else {
            bigCellHeight  = WIDTH_RATE * scope.GRID_WIDTH / firstRatio
          }

          GRID_HEIGHT               = bigCellHeight * 2 + scope.MARGIN; //margin bottom the first big image
          scope.parentStyle.height  = GRID_HEIGHT + "px";

          bigCellWidth              = scope.GRID_WIDTH * WIDTH_RATE - scope.MARGIN;
          bigCellStyle.width        = bigCellWidth;
          bigCellStyle.height       = bigCellHeight;
          bigCellStyle.left         = 0;

          smallCellWidth            = smallCellWidth        = scope.GRID_WIDTH - bigCellWidth;
          smallCellHeight           = (GRID_HEIGHT / (cellCount - 2)) - scope.MARGIN;
          smallCellStyle.width      = smallCellWidth;
          smallCellStyle.height     = smallCellHeight;
          smallCellStyle.right      = (-1) * scope.MARGIN;

          is2First                  = true; //flag this style is has 2 big image style

        } else if(firstRatio > 1) { //build style for grid more than 2 images and first image has firstRatio > 1
          bigCellStyle.marginBottom    = scope.MARGIN;
          smallCellStyle.marginRight   = scope.MARGIN;

          bigCellStyle.width    = scope.GRID_WIDTH;
          bigCellStyle.height   = scope.GRID_WIDTH / firstRatio;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = ( scope.GRID_WIDTH - smallCellCount*scope.MARGIN ) / smallCellCount;
          smallCellStyle.width  = smallCellWidth;

          // determine the height of smallCell below
          if (firstRatio > 1.3 && firstRatio < 1.5) { // 4:3 < firstRatio < 5:3
            smallCellHeight     = smallCellWidth / firstRatio;
          } else if (firstRatio > 1.5) {
            smallCellHeight     = smallCellWidth / 1.5
          } else {
            smallCellHeight     = smallCellWidth;
          }

          smallCellStyle.height = smallCellHeight;
          lastCellStyle.height  = smallCellHeight;

        } else { //build style for grid more than 2 images and first image has firstRatio <= 1
          bigCellStyle.marginRight       = scope.MARGIN;
          smallCellStyle.marginBottom    = scope.MARGIN;

          bigCellWidth          = Math.floor(scope.GRID_WIDTH * WIDTH_RATE) ;
          bigCellHeight         = bigCellWidth / firstRatio;

          bigCellStyle.width    = bigCellWidth;
          bigCellStyle.height   = bigCellHeight;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = scope.GRID_WIDTH - bigCellWidth - scope.MARGIN;
          smallCellHeight       = bigCellHeight / smallCellCount - scope.MARGIN

          smallCellStyle.width  = smallCellWidth;
          smallCellStyle.height = smallCellHeight
          lastCellStyle.width   = smallCellWidth
        }

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

      scope.getWidthRate      = function(firstRatio, cellCount) {
        if (cellCount == 2) { //build style for 2 images
          if(firstRatio > 1) {
            return 2/3;
          } else {
            return 1/2;
          }
        } else if(firstRatio > 1) { //build style for >= 3 images, first image has firstRatio > 1
          return 1
        } else if (firstRatio < 1) { //build style for >= 3 images, first image has firstRatio < 1
          return 2/3
        } else { //build style for >= 3 images, first image has firstRatio == 1
          return 3/4
        }
      }

      scope.getCellStyles     = function() {
        var margin, firstImage, secondImage, cellCount, bigCellStyle,
            smallCellStyle, smallCellCount, firstRatio, secondRatio, smallCellWidth, smallCellHeight,
            bigCellWidth, WIDTH_RATE, buildedStyle;

        firstImage            = scope.takenImages[0];
        secondImage           = scope.takenImages[1];
        cellCount             = scope.takenImages.length;

        if (cellCount == 1) { //build style for only one image
          //@todo need implement!
        } else { //build style for >=2 images
          buildedStyle        = scope.buildCellStyle(firstImage, secondImage, cellCount)
        }

        console.log("buildedStyle", buildedStyle)

        // remove margin right of last small cell in the bottom
        if(buildedStyle.small.marginRight) {
          buildedStyle.last.marginRight     = 0
          buildedStyle.last.width           = buildedStyle.small.width + scope.MARGIN;
        }

        // remove margin bottom of last small cell in the right
        if(buildedStyle.small.marginBottom) {
          buildedStyle.last.marginBottom    = 0
          buildedStyle.last.height          = buildedStyle.small.height + scope.MARGIN;
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
      scope.preloadImages();
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