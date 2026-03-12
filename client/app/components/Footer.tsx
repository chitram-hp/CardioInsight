export default function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-10">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-3 gap-8 text-center md:text-left">
        
        {/* Project Info */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-indigo-400">
            CardioInsight AI
          </h2>
          <p className="text-sm opacity-80">
            AI-Powered Heart Disease Prediction System designed to assist 
            in early detection and healthcare decision support.
          </p>
        </div>

        {/* Contact Info */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-indigo-400">
            Contact
          </h2>
          <p className="text-sm opacity-80">📧 chitramuthuvinayagam@gmail.com</p>
          <p className="text-sm opacity-80">📞 +91 7397114399</p>
          <p className="text-sm opacity-80">📍 Tamilnadu</p>
        </div>

        {/* Developer Info */}
        <div>
          <h2 className="text-lg font-semibold mb-3 text-indigo-400">
            Developer
          </h2>
          <p className="text-sm opacity-80">
            Developed by Chitra
          </p>
          <p className="text-sm opacity-80">
            Infosys Internship Project – 2026
          </p>
          <a
            href="https://www.linkedin.com/in/chitra-mv"
            target="_blank"
            className="text-sm text-indigo-400 hover:underline"
          >
            LinkedIn Profile
          </a>
        </div>

      </div>

      {/* Bottom Line */}
      <div className="border-t border-gray-700 mt-8 pt-4 text-center text-xs opacity-60">
        © 2026 CardioInsight AI — All Rights Reserved
      </div>
    </footer>
  );
}