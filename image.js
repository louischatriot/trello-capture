/*
 * Shapes to be drawn
 * The needed API for a shape is:
 * - The constructor that creates and draw the transient shape
 * - updatePosition that redraws the shape when the mouse moves
 * - persistOnCanvas that draws the transient shape on the underlying canvas.
                     It takes a callback as argument to tell when work is done since some persistence functions will need to be async due to image loading
 * - hide that hides the shape (figures ...)
 */
 
// ms is a ModifiedScreenshot object
function Rectangle (top, left, color, ms) {
  this.originTop = top;
  this.originLeft = left;
  this.color = color || '#ffaa00';   // Default colour is orange
  this.ms = ms;
  
  // $transient is a pointer to the transient (i.e. not persisted to the canvas) rectangle
  // Upon creation, the rectangle immediatly becomes visible
  this.$transient = $('<div></div>');
  this.ms.$screenshotPane.append(this.$transient);
  this.$transient.css('position', 'fixed');
  this.$transient.css('top', this.originTop + 'px');
  this.$transient.css('left', this.originLeft + 'px');
  this.$transient.css('border', this.color + ' solid 6px');
  this.$transient.css('box-shadow', '2px 2px 1px #666, -2px -2px 1px #666, -2px 2px 1px #666, 2px -2px 1px #666');
}

// Called when the mouse position changes
Rectangle.prototype.updatePosition = function (top, left) {
  this.lastTop = top;
  this.lastLeft = left;

  if (this.originTop <= top) {
    this.$transient.css('height', (top - this.originTop) + 'px');
    this.$transient.css('top', this.originTop + 'px');
  } else {
    this.$transient.css('height', (this.originTop - top) + 'px');
    this.$transient.css('top', top + 'px');  
  }
  
  if (this.originLeft <= left) {
    this.$transient.css('width', (left - this.originLeft) + 'px');
    this.$transient.css('left', this.originLeft + 'px');
  } else {
    this.$transient.css('width', (this.originLeft - left) + 'px');
    this.$transient.css('left', left + 'px');  
  }
};

// Persist this shape on the corresponding ModifiedScreenshot's canvas
Rectangle.prototype.persistOnCanvas = function (cb) {
  var left = parseInt(this.$transient.css('left').replace(/px/, ""), 10) - (this.ms.canvasW * (1 - this.ms.scale) / this.ms.scale)
    , top = parseInt(this.$transient.css('top').replace(/px/, ""), 10) - (this.ms.canvasH * (1 - this.ms.scale) / this.ms.scale)
    , width = parseInt(this.$transient.css('width').replace(/px/, ""), 10)
    , height = parseInt(this.$transient.css('height').replace(/px/, ""), 10)
    , callback = cb || function () {}
    ;

  this.ms.ctx.beginPath();
  this.ms.ctx.setLineWidth(6);
  this.ms.ctx.rect(left, top, width, height);
  this.ms.ctx.strokeStyle = this.color;   // TODO: understand why the change in stroke color is system-wide
  this.ms.ctx.shadowColor = '#666666';
  this.ms.ctx.shadowOffsetX = 1;
  this.ms.ctx.shadowOffsetY = 1;
  this.ms.ctx.stroke();
  this.ms.ctx.closePath();
  
  return callback();
};

Rectangle.prototype.hide = function () {
  this.$transient.css('display', 'none');
};


// === Arrow is not done so for now it's only a big rectangle to see the difference
function Arrow (top, left, color, ms) {
  this.originTop = top;
  this.originLeft = left;
  this.color = color || '#ffaa00';   // Default colour is orange
  this.ms = ms;
  
  // $transient is a pointer to the transient (i.e. not persisted to the canvas) rectangle
  // Upon creation, the rectangle immediatly becomes visible
  this.$transient = $('<div></div>');
  this.ms.$screenshotPane.append(this.$transient);
  this.$transient.css('position', 'fixed');
  this.$transient.css('top', this.originTop + 'px');
  this.$transient.css('left', this.originLeft + 'px');
  this.$transient.css('background-image', 'url(' + Arrow.arrowData + ')');
  this.$transient.css('background-repeat', 'no-repeat');
  this.$transient.css('background-size', 'contain');
}

// Original parameters of the image
Arrow.arrowImage = 'arrow.png'
Arrow.L0 = 360;
Arrow.l0 = 50;

// The base64 image data for the arrow is a static member of Arrow
Arrow.arrowData = null; 
Arrow.changeColor = function (_newColor) {
  var long = parseInt(_newColor.replace(/^#/, ""), 16)
    , newColor = { R: (long >>> 16) & 0xff
                 , G: (long >>> 8) & 0xff
                 , B: long & 0xff
                 }
    ;

  var img = new Image()
  img.src = 'arrow.png';
  img.onload = function() {
    var canvas = document.createElement("canvas")
      , ctx
      , originalPixels
      , currentPixels
      ;
      
    canvas.width = Arrow.L0;
    canvas.height = Arrow.l0;
    ctx = canvas.getContext("2d")
    ctx.drawImage(img, 0, 0, Arrow.L0, Arrow.l0);
    originalPixels = ctx.getImageData(0, 0, Arrow.L0, Arrow.l0);
    currentPixels = ctx.getImageData(0, 0, Arrow.L0, Arrow.l0);

    for(var i = 0; i < originalPixels.data.length; i += 4)
    {
      if(originalPixels.data[i + 3] > 0) // If it's not a transparent pixel
      {
        originalPixels.data[i] = Math.floor((255 - originalPixels.data[i]) * newColor.R / 255);
        originalPixels.data[i + 1] = Math.floor((255 - originalPixels.data[i + 1]) * newColor.G / 255);
        originalPixels.data[i + 2] = Math.floor((255 - originalPixels.data[i + 2]) * newColor.B / 255);
      }
    }

    ctx.putImageData(originalPixels, 0, 0);
    Arrow.arrowData = canvas.toDataURL("image/png");
  };
};

// Called when the mouse position changes
Arrow.prototype.updatePosition = function (top, left) {
  this.lastTop = top;
  this.lastLeft = left;

  // Don't crash if atan can't be calculated (very temporary state anyway)
  if (this.lastLeft === this.originLeft) { return; }

  var ol = (this.lastLeft + this.originLeft) / 2
    , ot = (this.lastTop + this.originTop) / 2
    , L = Math.sqrt(Math.pow(this.lastLeft - this.originLeft, 2) + Math.pow(this.lastTop - this.originTop, 2))
    , l = L * Arrow.l0 / Arrow.L0
    , tl = ol - (L / 2)
    , tt = ot - (l / 2)
    , theta = Math.atan((this.lastTop - this.originTop) / (this.lastLeft - this.originLeft)) * 180 / Math.PI
    ;
    
  if (this.lastLeft < this.originLeft) {
    theta += 180;
  }
  
  this.$transient.css('height', l + 'px');
  this.$transient.css('width', L + 'px');
  this.$transient.css('top', tt + 'px');
  this.$transient.css('left', tl + 'px');
  this.$transient.css('-webkit-transform', 'rotate(' + theta + 'deg)');  
};

// Persist this arrow on the corresponding ModifiedScreenshot's canvas
Arrow.prototype.persistOnCanvas = function (cb) {
  var ol = (this.lastLeft + this.originLeft) / 2 - (this.ms.canvasW * (1 - this.ms.scale) / this.ms.scale)
    , ot = (this.lastTop + this.originTop) / 2 - (this.ms.canvasH * (1 - this.ms.scale) / this.ms.scale)
    , L = Math.sqrt(Math.pow(this.lastLeft - this.originLeft, 2) + Math.pow(this.lastTop - this.originTop, 2))
    , l = L * Arrow.l0 / Arrow.L0
    , tl = ol - (L / 2)
    , tt = ot - (l / 2)
    , theta = Math.atan((this.lastTop - this.originTop) / (this.lastLeft - this.originLeft))
    , self = this
    , image = new Image()
    , callback = cb || function () {}
    , arrowData = this.$transient.css('background-image').substring(4, this.$transient.css('background-image').length - 1)
    ;

  if (this.lastLeft < this.originLeft) {
    theta += Math.PI;
  }

  // All canvas transformations must be in the same callback to avoid interferences between canvas rotations and translations
  image.src = arrowData;
  image.onload = function() {
    self.ms.ctx.translate(ol, ot);
    self.ms.ctx.rotate(theta);
    self.ms.ctx.drawImage(image, -L/2, -l/2, L, l);
    self.ms.ctx.rotate(-theta);
    self.ms.ctx.translate(-ol, -ot);
    
    return callback();
  }
};

Arrow.prototype.hide = function () {
  this.$transient.css('display', 'none');
};






/*
 * Drawing board management
 */
function ModifiedScreenshot () {
  this.canvas = document.getElementById('canvas');
  this.ctx = this.canvas.getContext('2d');
  this.$screenshotPane = $('#screenshot-pane');
  this.currentBase64Image = null;
  
  // Set canvas size
  this.canvasW = this.$screenshotPane.width();
  this.canvasH = this.$screenshotPane.height();
  this.scale = this.canvasW / $('body').width();
  
  $('#canvas').attr('width', this.canvasW);
  $('#canvas').attr('height', this.canvasH);

  this.possibleShapes = { rectangle: Rectangle, arrow: Arrow }
  
  // State of the "paintbrush"
  this.selectedShape;
  this.currentColor;
  this.currentShape;
  this.drawnShapes = [];
}


/**
 * Clear all drawings to date
 */
ModifiedScreenshot.prototype.clearAllDrawings = function () {
  this.currentShape = null;
  this.drawnShapes.forEach(function(shape) { shape.hide(); });
  this.drawnShapes = [];
};


/**
 * Manage color picker
 */
ModifiedScreenshot.prototype.initColorPicker = function () {
  var $color = $('#color')
    , colors = [ '#ffaa00', '#dbdb57', '#cb4d4d', '#34b27d', '#4d77cb', '#93c' ]
    , i = 0, $defaultPicker
    , self = this;

  colors.forEach(function(c) {
    var $picker = $('<div style="background-color: ' + c + ';"></div>');
    $picker.css('left', (20 * i++) + 'px');
  
    $picker.on('mouseover', function() {
      $picker.css('height', '34px');
    });
    
    $picker.on('mouseout', function() {
      $picker.css('height', '30px');
    });
  
    $picker.on('click', function () {
      $('#color div').removeClass('selected');
      $picker.addClass('selected');
      self.currentColor = c;
      Arrow.changeColor(self.currentColor);
    });
  
    $color.append($picker);
    
    if (!$defaultPicker) { $defaultPicker = $picker; }
  });
  
  // Simulate a user picking the default color, orange
  $defaultPicker.trigger('click');
};
 

// newShape is a string and must be a key to this.possibleShapes 
ModifiedScreenshot.prototype.updateSelectedShape = function (newShape) {
  this.selectedShape = this.possibleShapes[newShape];
};

/*
 * Let user draw shapes on the screenshot
 */
ModifiedScreenshot.prototype.initializeDrawingMode = function () {
  var self = this;  
  this.updateSelectedShape('rectangle');   // By default, draw a rectangle

  this.$screenshotPane.on('mousedown', function (evt) {
    if (self.currentShape) { return; }
    self.currentShape = new self.selectedShape(evt.clientY, evt.clientX, self.currentColor, self);
  });

  this.$screenshotPane.on('mouseup', function () {
    self.drawnShapes.push(self.currentShape);
    self.currentShape = null;
  });

  this.$screenshotPane.on('mousemove', function (evt) {
    if (! self.currentShape) { return; }
    self.currentShape.updatePosition(Math.min(evt.clientY, document.body.clientHeight - 3), evt.clientX);
  });
};


// Create the modified screenshot and transform it into a data url
// Async since some persistence functions need to be async
ModifiedScreenshot.prototype.persistCurrentScreenshot = function (cb) {
  var callback = cb || function () {}
    , self = this;
    
  async.eachSeries(this.drawnShapes, function (shape, cb) {
    shape.hide();
    shape.persistOnCanvas(cb);
  }, function () {
    self.currentBase64Image = self.canvas.toDataURL("image/jpeg");
    return callback();
  });
};


ModifiedScreenshot.prototype.setAsBackground = function (base64Image) {
  var image = new Image()
    , self = this;
    
  this.currentBase64Image = base64Image;
  image.src = base64Image;
  image.onload = function() {
    self.ctx.drawImage(image, 0, 0, self.canvasW, self.canvasH);
    self.initializeDrawingMode();   // TODO: uncomment
    $('body').trigger('trelloCapture.screenshotTaken');
  };
};

