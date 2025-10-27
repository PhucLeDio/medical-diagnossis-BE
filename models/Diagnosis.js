const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema({
  // Thông tin bệnh nhân
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  patientAge: {
    type: Number,
    required: true,
  },
  patientGender: {
    type: String,
    enum: ["Nam", "Nữ"],
    required: true,
  },

  // Các chỉ số sinh học
  age: Number,
  ap_hi: Number,
  ap_lo: Number,
  height_cm: Number,
  weight_kg: Number,
  bmi: Number,

  // Lối sống
  smoke: Number,
  alco: Number,
  active: Number,

  // Xét nghiệm
  cholesterol: Number,
  gluc: Number,
  gender: Number,

  // Kết quả chẩn đoán
  riskPercentage: {
    type: Number,
    required: true,
  },
  riskLevel: {
    type: String,
    enum: ["Thấp", "Trung bình", "Cao"],
    required: true,
  },
  possibleDiseases: [
    {
      name: String,
      probability: String,
    },
  ],

  // Ghi chú
  notes: String,

  // Thời gian
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Diagnosis", diagnosisSchema);
