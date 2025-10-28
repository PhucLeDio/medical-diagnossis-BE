const mongoose = require("mongoose");

const diagnosisSchema = new mongoose.Schema({
  // Thông tin bệnh nhân (Từ req.body)
  patientName: {
    type: String,
    required: true,
    trim: true,
  },
  patientAge: { // <-- Lưu tuổi gốc
    type: Number,
    required: true,
  },
  patientGender: { // <-- Lưu giới tính gốc
    type: String,
    enum: ["Nam", "Nữ"],
    required: true,
  },

  // Các chỉ số sinh học (Từ req.body)
  ap_hi: Number,
  ap_lo: Number,
  height: Number, // <-- Dùng 'height'
  weight: Number, // <-- Dùng 'weight'
  bmi: Number,    // <-- Lưu BMI đã tính

  // Lối sống (Từ req.body)
  smoke: Number,
  alco: Number,
  active: Number,

  // Xét nghiệm (Từ req.body)
  cholesterol: Number,
  gluc: Number,

  // --- CÁC TRƯỜNG DƯ THỪA ĐÃ BỊ XÓA ---
  // age, gender, height_cm, weight_kg

  // Kết quả chẩn đoán (Tính toán)
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
      probability: Number, // <-- Sửa thành Number
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