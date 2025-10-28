const express = require("express");
const router = express.Router();
const Diagnosis = require("../models/Diagnosis");
const axios = require("axios");

// POST: Tạo chẩn đoán mới
// POST: Tạo chẩn đoán mới
router.post("/", async (req, res) => {
  try {
    // data là dữ liệu gốc từ frontend (ví dụ: patientGender: "Nam")
    const data = req.body;

    // ---- SỬA LỖI 422 ----
    // 1. Tạo một "payload" SẠCH để gửi cho Python
    const payloadForPython = {
      age: data.patientAge,
      gender: (data.patientGender === "Nam" ? 2 : 1),

      // ---- SỬA LỖI Ở ĐÂY ----
      // Đọc 'height_cm' từ req.body và gán vào 'height' cho Python
      height: data.height_cm,

      // Đọc 'weight_kg' từ req.body và gán vào 'weight' cho Python
      weight: data.weight_kg,
      // --------------------

      ap_hi: data.ap_hi,
      ap_lo: data.ap_lo,
      cholesterol: data.cholesterol,
      gluc: data.gluc,
      smoke: data.smoke,
      alco: data.alco,
      active: data.active
    };

    // Kiểm tra xem frontend có gửi đủ không
    if (!payloadForPython.height || !payloadForPython.weight) {
      return res.status(400).json({
        message: "Thiếu thông tin 'height_cm' hoặc 'weight_kg' từ frontend."
      });
    }

    // 2. Gửi payload SẠCH sang Python API
    const pyRes = await axios.post("https://heart-disease-api-9wbv.onrender.com/predict", payloadForPython); // (Sửa URL của bạn)
    const probability = pyRes.data.probability;
    // --------------------

    // 3. Xác định mức độ nguy cơ
    let riskLevel;
    if (probability < 0.3) riskLevel = "Thấp";
    else if (probability < 0.6) riskLevel = "Trung bình";
    else riskLevel = "Cao";

    // 4. Lưu vào MongoDB
    // SỬA LỖI: Dùng đúng tên biến 'data.weight_kg' và 'data.height_cm'
    const bmi = data.weight_kg / ((data.height_cm / 100) ** 2);

    const diagnosis = new Diagnosis({
      ...data,
      bmi: bmi.toFixed(2), // Bây giờ 'bmi' sẽ là một số (ví dụ: "22.49")
      riskPercentage: Math.round(probability * 100),
      riskLevel,
    });

    const savedDiagnosis = await diagnosis.save();
    res.status(201).json(savedDiagnosis);

  } catch (error) {
    // Code catch (bắt lỗi) chi tiết từ lần trước
    if (error.response) {
      console.error("LỖI VALIDATION TỪ PYTHON API:", error.response.data);
      res.status(422).json({
        message: "Dữ liệu gửi lên API Python không hợp lệ.",
        details: error.response.data
      });
    } else {
      console.error("Lỗi khi gọi API Python:", error.message);
      res.status(500).json({ message: error.message });
    }
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
