const express = require("express");
const router = express.Router();
const Diagnosis = require("../models/Diagnosis");

// Hàm tính toán nguy cơ và các bệnh có thể mắc
const calculateRisk = (data) => {
  const { age, ap_hi, ap_lo, bmi, smoke, alco, cholesterol, gluc, active } =
    data;

  // Tính nguy cơ cơ bản
  let riskScore = 0;

  // Tuổi
  if (age > 60) riskScore += 30;
  else if (age > 50) riskScore += 20;
  else if (age > 40) riskScore += 10;

  // Huyết áp
  if (ap_hi > 140 || ap_lo > 90) riskScore += 25;
  else if (ap_hi > 130 || ap_lo > 85) riskScore += 15;

  // BMI
  if (bmi > 30) riskScore += 20;
  else if (bmi > 25) riskScore += 10;

  // Lối sống
  if (smoke === 1) riskScore += 15;
  if (alco === 1) riskScore += 10;
  if (active === 0) riskScore += 10;

  // Xét nghiệm
  if (cholesterol === 3) riskScore += 20;
  else if (cholesterol === 2) riskScore += 10;

  if (gluc === 3) riskScore += 20;
  else if (gluc === 2) riskScore += 10;

  const riskPercentage = Math.min(riskScore, 100);

  // Xác định mức độ nguy cơ
  let riskLevel;
  if (riskPercentage < 30) riskLevel = "Thấp";
  else if (riskPercentage < 60) riskLevel = "Trung bình";
  else riskLevel = "Cao";

  // Xác định các bệnh có thể mắc
  const possibleDiseases = [];

  if (ap_hi > 140 || ap_lo > 90) {
    possibleDiseases.push({
      name: "Tăng huyết áp",
      probability: ap_hi > 160 ? "Cao" : "Trung bình",
    });
  }

  if (cholesterol > 1 || bmi > 25) {
    possibleDiseases.push({
      name: "Bệnh tim mạch",
      probability: cholesterol === 3 && bmi > 30 ? "Cao" : "Trung bình",
    });
  }

  if (gluc > 1) {
    possibleDiseases.push({
      name: "Tiểu đường",
      probability: gluc === 3 ? "Cao" : "Trung bình",
    });
  }

  if (bmi > 30) {
    possibleDiseases.push({
      name: "Béo phì",
      probability: bmi > 35 ? "Cao" : "Trung bình",
    });
  }

  if (smoke === 1 && age > 40) {
    possibleDiseases.push({
      name: "Bệnh phổi mãn tính",
      probability: "Trung bình",
    });
  }

  if (possibleDiseases.length === 0) {
    possibleDiseases.push({
      name: "Không phát hiện dấu hiệu bất thường",
      probability: "Thấp",
    });
  }

  return { riskPercentage, riskLevel, possibleDiseases };
};

// POST: Tạo chẩn đoán mới
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // Tính toán nguy cơ và bệnh
    const { riskPercentage, riskLevel, possibleDiseases } = calculateRisk(data);

    const diagnosis = new Diagnosis({
      ...data,
      riskPercentage,
      riskLevel,
      possibleDiseases,
    });

    const savedDiagnosis = await diagnosis.save();
    res.status(201).json(savedDiagnosis);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// GET: Lấy tất cả lịch sử chẩn đoán
router.get("/", async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find().sort({ createdAt: -1 });
    res.json(diagnoses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Lấy một chẩn đoán theo ID
router.get("/:id", async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findById(req.params.id);
    if (!diagnosis) {
      return res.status(404).json({ message: "Không tìm thấy chẩn đoán" });
    }
    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// DELETE: Xóa một chẩn đoán
router.delete("/:id", async (req, res) => {
  try {
    const diagnosis = await Diagnosis.findByIdAndDelete(req.params.id);
    if (!diagnosis) {
      return res.status(404).json({ message: "Không tìm thấy chẩn đoán" });
    }
    res.json({ message: "Đã xóa chẩn đoán thành công" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET: Tìm kiếm theo tên bệnh nhân
router.get("/search/:name", async (req, res) => {
  try {
    const diagnoses = await Diagnosis.find({
      patientName: { $regex: req.params.name, $options: "i" },
    }).sort({ createdAt: -1 });
    res.json(diagnoses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
