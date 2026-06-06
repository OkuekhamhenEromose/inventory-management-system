const mongoose = require('mongoose');
const { paginatePlugin } = require('./plugins');

const stockLevelSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: [true, 'Product is required'],
    },
    location: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Location',
      required: [true, 'Location is required'],
    },
    quantity: {
      type: Number,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    reservedQuantity: {
      type: Number,
      default: 0,
      min: [0, 'Reserved quantity cannot be negative'],
    },
    minimumStock: {
      type: Number,
      default: 10,
    },
    maximumStock: {
      type: Number,
      default: 1000,
    },
    lastCounted: {
      type: Date,
      default: Date.now,
    },
    lastMovement: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ['active', 'depleted', 'overstocked', 'discontinued'],
      default: 'active',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound unique index
stockLevelSchema.index({ product: 1, location: 1 }, { unique: true });
stockLevelSchema.index({ location: 1, quantity: 1 });
stockLevelSchema.index({ product: 1, status: 1 });
stockLevelSchema.index({ quantity: 1 }); // For low stock queries

// Virtual for available quantity
stockLevelSchema.virtual('availableQuantity').get(function () {
  return this.quantity - this.reservedQuantity;
});

// Pre-save hook to update status
stockLevelSchema.pre('save', function (next) {
  const available = this.quantity - this.reservedQuantity;
  
  if (available <= 0) {
    this.status = 'depleted';
  } else if (available >= this.maximumStock) {
    this.status = 'overstocked';
  } else if (available <= this.minimumStock) {
    this.status = 'active'; // Low stock but still active
  } else {
    this.status = 'active';
  }
  
  next();
});

// Static method to find low stock items
stockLevelSchema.statics.findLowStock = async function (locationId = null) {
  const match = {
    $expr: {
      $lte: [{ $subtract: ['$quantity', '$reservedQuantity'] }, '$minimumStock'],
    },
  };
  
  if (locationId) {
    match.location = new mongoose.Types.ObjectId(locationId);
  }
  
  return this.aggregate([
    { $match: match },
    {
      $lookup: {
        from: 'products',
        localField: 'product',
        foreignField: '_id',
        as: 'product',
      },
    },
    { $unwind: '$product' },
    {
      $lookup: {
        from: 'locations',
        localField: 'location',
        foreignField: '_id',
        as: 'location',
      },
    },
    { $unwind: '$location' },
    {
      $project: {
        product: { name: 1, sku: 1, unitPrice: 1 },
        location: { name: 1, code: 1 },
        quantity: 1,
        availableQuantity: 1,
        minimumStock: 1,
        status: 1,
      },
    },
  ]);
};

stockLevelSchema.plugin(paginatePlugin);

const StockLevel = mongoose.model('StockLevel', stockLevelSchema);

module.exports = StockLevel;