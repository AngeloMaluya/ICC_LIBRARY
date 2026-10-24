import "./termsModal.css";

const TermsModal = ({ onClose, onAgree }) => {
  return (
    <div className="terms-overlay">
      <div className="terms-modal">

        <div className="terms-content">
          <h1>Terms and Conditions</h1>

        <span>
            By logging in to the ICC Web-Based Library Management System, you agree to comply with the following terms:
            Authorized Access. This system is exclusively for authorized Immaculada Concepcion College (ICC) students, faculty, and staff. 
            Your ICC account must be used to access the system.
        </span>
        
            <h5>Library-Only Access</h5>

        <p>
            The system is intended for use within the ICC library and may not be accessed outside the authorized library 
            environment.
        </p>

            <h5>Research Materials</h5>

        <p>
            Research and thesis documents available in the system are provided for academic and educational purposes 
            only. Users may view and read the materials but may not upload, modify, delete, or redistribute them.
        </p>
        
            <h5>Content Protection</h5>
        
        <p>
            Users are not permitted to copy, paste, highlight, download, or capture screenshots of research and thesis 
            materials through the system. These restrictions are intended to protect ICC's academic resources and the 
            intellectual property of the authors.
        </p>

            <h5>AI-Assisted Summary</h5>
        
        <p>            
            AI-generated summaries are provided only as an aid for understanding research materials. Users should refer 
            to the original document for complete and accurate information.
        </p>

            <h5>Account Responsibility</h5>

        <p>
            Users are responsible for keeping their school account credentials secure and must not share their account 
            with others.
        </p>

            <h5>Proper Use</h5>

        <p>
            Any attempt to bypass system restrictions, gain unauthorized access, or misuse research materials is prohibited 
            and may be subject to appropriate school policies.
        </p>

            <h5>Library Rules</h5>

        <p>
            Users must comply with the existing rules and regulations of the ICC library, including the prohibition of mobile 
            phones inside the library.

            By checking “I agree,” you confirm that you have read, understood, and agree to follow these Terms and Conditions.
          </p>
        </div>

        <div className="terms-buttons">
          <button
            type="button"
            className="terms-cancel"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="button"
            className="terms-agree"
            onClick={onAgree}
          >
            I Agree
          </button>
        </div>

      </div>
    </div>
  );
};

export default TermsModal;