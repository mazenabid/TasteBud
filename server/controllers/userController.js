const { sendUserReport } = require("../services/emailService");

const getUserReportPDF = async (req, res) => {
  try {
    const userId = req.user;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({ error: "Year and month required" });
    }

    sendUserReport(userId, Number(year), Number(month))
      .catch(err => console.error("Background report failed:", err));
    res.json({ message: "Report generated and emailed successfully" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getUserReportPDF
};