/*
 * Shapes to be drawn
 * The needed API for a shape is:
 * - The constructor that creates and draw the transient shape
 * - updatePosition that redraws the shape when the mouse moves
 * - persistOnCanvas that draws the transient shape on the underlying canvas
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
Rectangle.prototype.persistOnCanvas = function () {
  var left = parseInt(this.$transient.css('left').replace(/px/, ""), 10) - (this.ms.canvasW * (1 - this.ms.scale) / this.ms.scale)
    , top = parseInt(this.$transient.css('top').replace(/px/, ""), 10) - (this.ms.canvasH * (1 - this.ms.scale) / this.ms.scale)
    , width = parseInt(this.$transient.css('width').replace(/px/, ""), 10)
    , height = parseInt(this.$transient.css('height').replace(/px/, ""), 10)
    ;

  this.ms.ctx.setLineWidth(6);
  this.ms.ctx.rect(left, top, width, height);
  this.ms.ctx.strokeStyle = this.color;   // TODO: understand why the change in stroke color is system-wide
  this.ms.ctx.shadowColor = '#666666';
  this.ms.ctx.shadowOffsetX = 1;
  this.ms.ctx.shadowOffsetY = 1;
  this.ms.ctx.stroke();
};

Rectangle.prototype.hide = function () {
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
  
  // State of the "paintbrush"
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
 * Still need to understand how to override the blue hue when changing an option
 */
ModifiedScreenshot.prototype.initColorPicker = function () {
  var $color = $('#color')
    , colors = [ '#ffaa00', '#ff0000', '#00ffff' ]
    , self = this;

  colors.forEach(function(c) {
    $color.append('<option value="' + c + '" style="background-color: ' + c + ';"></option>');
  });

  $color.on('change', function () {
    self.currentColor = $('#color option:selected').val();
    $color.css('background-color', self.currentColor);
  });
  
  // Simukate a user picking the default color, orange
  $color.trigger('change');
};
 

/*
 * Manage rectangle drawing mode
 */
ModifiedScreenshot.prototype.switchToRectangleDrawingMode = function () {
  var self = this;

  this.$screenshotPane.on('mousedown', function (evt) {
    self.currentShape = new Rectangle(evt.clientY, evt.clientX, self.currentColor, self);
  });

  this.$screenshotPane.on('mouseup', function () {
    self.drawnShapes.push(self.currentShape);
    self.currentShape = null;
  });

  this.$screenshotPane.on('mousemove', function (evt) {
    if (! self.currentShape) { return; }

    self.currentShape.updatePosition(Math.min(evt.clientY, self.canvasH - 3), evt.clientX);
  });
};


// Create the modified screenshot and transform it into a data url
ModifiedScreenshot.prototype.persistCurrentScreenshot = function () {
  this.drawnShapes.forEach(function (shape) {
    shape.hide();
    shape.persistOnCanvas();
  });

  this.currentBase64Image = this.canvas.toDataURL("image/jpeg");
};


ModifiedScreenshot.prototype.setAsBackground = function (base64Image) {
  var image = new Image()
    , self = this;
    
  this.currentBase64Image = base64Image;
  image.src = base64Image;
  image.onload = function() {
    // TODO: Calculate non-scaling coordinates better than that
    self.ctx.drawImage(image, 0, 0, self.canvasW, self.canvasH);
    self.switchToRectangleDrawingMode();
    $('body').trigger('trelloCapture.screenshotTaken');
  };
};

