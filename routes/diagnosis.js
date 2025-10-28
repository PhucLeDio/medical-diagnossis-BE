const express = require("express");
const router = express.Router();
const Diagnosis = require("../models/Diagnosis");
const axios = require("axios");

// POST: Tạo chẩn đoán mới
router.post("/", async (req, res) => {
  try {
    const data = req.body;

    // Gửi dữ liệu sang Python API để lấy xác suất dự đoán
    const pyRes = await axios.post("http://localhost:8050/predict", data);
    const probability = pyRes.data.probability;

    // Xác định mức độ nguy cơ dựa trên xác suất
    let riskLevel;
    if (probability < 0.3) riskLevel = "Thấp";
    else if (probability < 0.6) riskLevel = "Trung bình";
    else riskLevel = "Cao";

    // Lưu vào MongoDB
    const diagnosis = new Diagnosis({
      ...data,
      riskPercentage: Math.round(probability * 100),
      riskLevel,
      possibleDiseases: [], // Có thể bổ sung logic nếu muốn
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
