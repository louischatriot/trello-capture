/*
 * Image management
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
  // $('#canvas').css('position', 'relative');
  // $('#canvas').css('top', (100 * (1 - this.scale)) + '%');  
  
  // State of the currently drawn rectangle
  this.$currentRectangle = null;
  this.originTop = null;
  this.originLeft = null;
  
  window.iii = this;
}
 

/*
 * Manage rectangle drawing mode
 */
ModifiedScreenshot.prototype.switchToRectangleDrawingMode = function () {
  var self = this;

  this.$screenshotPane.on('mousedown', function (evt) {
    self.originTop = evt.clientY;
    self.originLeft = evt.clientX;
  
    self.$currentRectangle = $('<div class="rectangle"></div>');
    self.$screenshotPane.append(self.$currentRectangle);
    self.$currentRectangle.css('top', self.originTop + 'px');
    self.$currentRectangle.css('left', self.originLeft + 'px');
  });

  this.$screenshotPane.on('mouseup', function () {
    var left = parseInt(self.$currentRectangle.css('left').replace(/px/, ""), 10) - (self.canvasW * (1 - self.scale) / self.scale)
      , top = parseInt(self.$currentRectangle.css('top').replace(/px/, ""), 10) - (self.canvasH * (1 - self.scale) / self.scale)
      , width = parseInt(self.$currentRectangle.css('width').replace(/px/, ""), 10)
      , height = parseInt(self.$currentRectangle.css('height').replace(/px/, ""), 10)
      ;
    
    self.ctx.setLineWidth(6);
    self.ctx.rect(left, top, width, height);
    self.ctx.strokeStyle = '#ffaa00';
    self.ctx.shadowColor = '#666666';
    self.ctx.shadowOffsetX = 1;
    self.ctx.shadowOffsetY = 1;
    self.ctx.stroke();

    self.$currentRectangle.css('display', 'none');
    self.$currentRectangle = null;
  });

  this.$screenshotPane.on('mousemove', function (evt) {
    if (! self.$currentRectangle) { return; }
    
    var currentX = evt.clientX
      , currentY = Math.min(evt.clientY, self.canvasH - 3)
      ;

    if (self.originTop <= currentY) {
      self.$currentRectangle.css('height', (currentY - self.originTop) + 'px');
      self.$currentRectangle.css('top', self.originTop + 'px');
    } else {
      self.$currentRectangle.css('height', (self.originTop - currentY) + 'px');
      self.$currentRectangle.css('top', currentY + 'px');  
    }
    
    if (self.originLeft <= currentX) {
      self.$currentRectangle.css('width', (currentX - self.originLeft) + 'px');
      self.$currentRectangle.css('left', self.originLeft + 'px');
    } else {
      self.$currentRectangle.css('width', (self.originLeft - currentX) + 'px');
      self.$currentRectangle.css('left', currentX + 'px');  
    }
  });
};


ModifiedScreenshot.prototype.persistCurrentScreenshot = function () {
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

