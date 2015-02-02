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
      scope.parentWidth         = element.prop('offsetWidth');
      scope.MARGIN              = scope.defaultOptions.margin;
      scope.MAX_LENGTH          = scope.defaultOptions.maxLength;

      if (!scope.parentWidth || scope.parentWidth < 320) { // set the default width of parent
        scope.parentWidth       = 320
      }
      scope.parentStyle         = { width: scope.parentWidth + "px", overflow: "hidden" }
      scope.commonStyle         = {
                                    display:        'inline-block',
                                    position:       'relative',
                                    overflow:       'hidden',
                                    cssFloat:       'left',
                                    verticalAlign:  'top',
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

        if(sortedImages.length < scope.MAX_LENGTH) {
          return sortedImages
        } else {
          return sortedImages.slice(0, scope.MAX_LENGTH)
        }
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
        smallCellWidth, firstRatio, bigCellWidth, cellCount;

        // get cell style & builded options
        styles          = scope.getCellStyles();
        smallCellHeight = styles.options.smallCellHeight;
        smallCellWidth  = styles.options.smallCellWidth;
        firstRatio      = styles.options.firstRatio;
        bigCellWidth    = styles.options.bigCellWidth;
        cellCount       = styles.options.cellCount;

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
                    && (image.naturalWidth < bigCellWidth || image.naturalWidth < scope.parentWidth)) {

            //if the natural width of image were too small, we would scale it up to parent's wrap
            imageStyle.width  = "100%";
          }

          // set image cell has max height or max width
          if(curHeight < smallCellHeight) {
            imageStyle.maxHeight  = "100%";
          } else {
            imageStyle.maxWidth   = "100%";
          }

          //apply these cell styles and image style
          image.imageStyle      = imageStyle
          if(index == 0) { //big cell style
            image.cellStyle     = styles.big;

          } else if (index != cellCount - 1 || cellCount == 2){ //small cells
            image.cellStyle     = styles.small;

          } else { //last small cell style (remove redundant margin right or bottom)
            image.cellStyle     = styles.last;
          }
        })

        // apply the binding, display the grid in view
        scope.loadedImages      = scope.takenImages;
        scope.$apply()
      }

      scope.buildCellStyle      = function (ratio, cellCount) {
        var bigCellStyle, smallCellStyle, lastCellStyle, widthRate,
            bigCellWidth, smallCellHeight, smallCellWidth;

        bigCellStyle            = angular.copy(scope.commonStyle);
        smallCellStyle          = angular.copy(scope.commonStyle);
        lastCellStyle           = angular.copy(scope.commonStyle);
        widthRate               = scope.getWidthRate(ratio, cellCount);

        if(cellCount == 2) { //build style for grid has 2 images and first image has ratio > 1
          var marginSize              = scope.MARGIN / cellCount;
          bigCellStyle.marginRight    = marginSize;
          smallCellStyle.marginLeft   = marginSize;

          bigCellWidth          = Math.floor(scope.parentWidth * widthRate) - scope.MARGIN;
          bigCellStyle.width    = bigCellWidth;
          bigCellStyle.height   = bigCellWidth / ratio;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = scope.parentWidth - bigCellWidth - scope.MARGIN;
          smallCellHeight       = bigCellWidth / ratio;
          smallCellStyle.width  = smallCellWidth;
          smallCellStyle.height = smallCellHeight;

        } else if(ratio > 1) { //build style for grid more than 2 images and first image has ratio > 1
          bigCellStyle.marginBottom    = scope.MARGIN;
          smallCellStyle.marginRight   = scope.MARGIN;

          bigCellStyle.width    = scope.parentWidth;
          bigCellStyle.height   = scope.parentWidth / ratio;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = ( scope.parentWidth - smallCellCount*scope.MARGIN ) / smallCellCount;
          smallCellStyle.width  = smallCellWidth;

          // determine the height of smallCell below
          if (ratio > 1.3 && ratio < 1.5) { // 4:3 < ratio < 5:3
            smallCellHeight     = smallCellWidth / ratio;
          } else if (ratio > 1.5) {
            smallCellHeight     = smallCellWidth / 1.5
          } else {
            smallCellHeight     = smallCellWidth;
          }

          smallCellStyle.height = smallCellHeight;
          lastCellStyle.height  = smallCellHeight;

        } else { //build style for grid more than 2 images and first image has ratio <= 1
          bigCellStyle.marginRight       = scope.MARGIN;
          smallCellStyle.marginBottom    = scope.MARGIN;

          bigCellWidth          = Math.floor(scope.parentWidth * widthRate) ;
          bigCellHeight         = bigCellWidth / ratio;

          bigCellStyle.width    = bigCellWidth;
          bigCellStyle.height   = bigCellHeight;

          smallCellCount        = cellCount - 1;
          smallCellWidth        = scope.parentWidth - bigCellWidth - scope.MARGIN;
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
            firstRatio:       ratio,
            smallCellWidth:   smallCellWidth,
            smallCellHeight:  smallCellHeight,
            bigCellWidth:     bigCellWidth,
            cellCount:        cellCount
          } //keep these values to style cell image after building style for cell link
        }
      }

      scope.getWidthRate      = function(ratio, cellCount) {
        if (cellCount == 2) { //build style for 2 images
          if(ratio > 1) {
            return 2/3;
          } else {
            return 1/2;
          }
        } else if(ratio > 1) { //build style for >= 3 images, first image has ratio > 1
          return 1
        } else if (ratio < 1) { //build style for >= 3 images, first image has ratio < 1
          return 2/3
        } else { //build style for >= 3 images, first image has ratio == 1
          return 3/4
        }
      }

      scope.getCellStyles     = function() {
        var margin, firstImage, secondImage, cellCount, bigCellStyle,
            smallCellStyle, smallCellCount, ratio, smallCellWidth, smallCellHeight,
            bigCellWidth, widthRate, buildedStyle;

        firstImage            = scope.takenImages[0];
        secondImage           = scope.takenImages[1];
        cellCount             = scope.takenImages.length;
        ratio                 = firstImage.naturalWidth / firstImage.naturalHeight;

        if (cellCount == 1) { //build style for only one image
          //@todo need implement!
        } else { //build style for >=2 images
          buildedStyle        = scope.buildCellStyle(ratio, cellCount)
        }

        bigCellStyle          = buildedStyle.big;
        smallCellStyle        = buildedStyle.small;
        lastCellStyle         = buildedStyle.last;
        options               = buildedStyle.options;

        // remove margin right of last small cell in the bottom
        if(smallCellStyle.marginRight) {
          lastCellStyle.marginRight     = 0
          lastCellStyle.width           = smallCellStyle.width + scope.MARGIN;
        }

        // remove margin bottom of last small cell in the right
        if(smallCellStyle.marginBottom) {
          lastCellStyle.marginBottom    = 0
          lastCellStyle.height          = smallCellStyle.height + scope.MARGIN;
        }

        // add suffix px for margin and size for ng-style working
        attrs = ["width", "height", "marginRight", "marginLeft", "marginBottom"]
        angular.forEach(attrs, function(attr, index) {
          if(bigCellStyle[attr]) {
            bigCellStyle[attr]         += "px"
          }
          if(smallCellStyle[attr]) {
            smallCellStyle[attr]       += "px"
          }
          if(lastCellStyle[attr]) {
            lastCellStyle[attr]        += "px"
          }
        })

        return {
          big:      bigCellStyle,
          small:    smallCellStyle,
          last:     lastCellStyle,
          options:  options
        }
      }

      //functions call when init
      scope.preloadImages();
    }

    return {
      restrict:       "A",
      templateUrl:    "photo_grid.html",
      scope: {
        images:       "=images",
        builded:      "&",
        clicked:      "&",
        gridOptions:  "=gridOptions"
      },
      link: linker
    }



  }])