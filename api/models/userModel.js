const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  email: {
    type: String,
    unique: true,
    required: true,
    validate: {
      validator: function (v) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: (props) => `${props.value} is not a valid email address!`,
    },
  },
  phone: { type: String, required: true },
  agreeToTerms: { type: Boolean },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  role: {
    type: String,
    enum: ["manufacturer", "distributor", "store" , "user"],
    default: "distributor",
  },
});

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (this.isModified("password") || this.isNew) {
    try {
      this.password = await bcrypt.hash(this.password, 10);
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

// Compare password for login
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
module.exports = User;

// businessName: { type: String },
// businessLocation: { type: String },
// businessRegistrationNumber: { type: String },
// taxIdentificationNumber: { type: String },
// govtIdImage: { type: String }, // Path or URL to the Government Issued ID image
// cacCertImage: { type: String }, // Path or URL to the CAC Certificate image
