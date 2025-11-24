import React from "react";
import Breadcrumb from "@/components/breadcrumb/Breadcrumb";

export const metadata = {
  title: "Terms of Service | ASVAB Tutoring",
  description: "Read our Terms of Service outlining the rules, responsibilities, and legal agreements for using ASVAB Tutoring services.",
};

export default function TermsOfServicePage() {
  return (
    <section className="bg-light">
      {/* Banner */}
      <div className="banner bg-black bg-opacity-50 py-3 px-4 rounded flex flex-col items-center text-center mb-5">
        <h1 className="text-white mb-2 text-3xl font-bold">Terms of Service</h1>
        <Breadcrumb segments={["terms-of-service"]} className="text-white text-base mt-1" />
      </div>

      {/* Content */}
      <div className="container py-4">
        <p><strong>TERMS OF SERVICE</strong></p>
        <p><strong>ASVAB Tutoring, Inc. Terms of Service</strong></p>
        <p><strong>Last updated: January 9, 2020</strong></p>
        <hr />

        <p>
          Please read these Terms and Conditions (“Terms”, “Terms and Conditions”) carefully before using the
          <a href="https://www.asvab-tutoring.com/" className="text-primary" target="_blank" rel="noopener noreferrer">
            {" "}https://www.asvab-tutoring.com/
          </a>{" "}
          website and the ASVAB Tutoring mobile application (together, or individually, the “Service”) operated by ASVAB Tutoring LLC.
        </p>
        <p>
          Your access to and use of the Service is conditioned upon your acceptance of and compliance with these Terms.
          These Terms apply to all visitors, users and others who wish to access or use the Service.
        </p>
        <p>
          By accessing or using the Service you agree to be bound by these Terms. If you disagree with any part of the terms then you do not have permission to access the Service.
        </p>

        <h4 className="mt-4 mb-2 fw-bold">1. Purchases</h4>
        <p>
          If you wish to purchase any product or service made available through the Service (“Purchase”), you may be asked to provide certain information relevant to your Purchase including, without limitation, your credit card number, the expiration date of your credit card, your billing address, and your shipping information.
        </p>
        <p>
          You represent and warrant that: (i) you have the legal right to use any credit card(s) or other payment method(s) in connection with any Purchase; and that (ii) the information you supply to us is true, correct and complete.
        </p>
        <p>
          The service may employ the use of third-party services for the purpose of facilitating payment and the completion of Purchases.
          By submitting your information, you grant us the right to provide the information to these third parties subject to our Privacy Policy.
        </p>
        <p>
          We reserve the right to refuse or cancel your order at any time for reasons including but not limited to:
          product or service availability, errors in the description or price of the product or service, error in your order or other reasons.
        </p>
        <p>
          We reserve the right to refuse or cancel your order if fraud or an unauthorized or illegal transaction is suspected.
        </p>

        <h4 className="mt-4 mb-2 fw-bold">2. Accounts</h4>
        <p>
          Users under the age of 18 (a “Minor”) shall have their legal guardian or parent agree to these Terms and our Privacy Policy on their behalf,
          and such legal guardian or parent shall be responsible for all actions taken under the account.
          We do not share any personal data or personally identifiable information received or collected from the service unless we have your consent,
          it is required by law, or we are required to do so in order to continue providing our service.
          Further, we do not knowingly collect or store sensitive data, or personally identifiable information from anyone under the age of 13.
          Pursuant to COPPA, we do not target or market our services to children below the age of 13. Persons under the age of 13 are not permitted to use the services.
        </p>
        <p>
          When you create an account with us, you guarantee that you are above the age of 13, and that the information you provide us is accurate, complete, and current at all times.
          Inaccurate, incomplete, or obsolete information may result in the immediate termination of your account on the Service.
        </p>
        <p>
          You are responsible for maintaining the confidentiality of your account and password, including but not limited to the restriction of access to your computer and/or account.
          You agree to accept responsibility for any and all activities or actions that occur under your account and/or password,
          whether your password is with our Service or a third-party service.
          You must notify us immediately upon becoming aware of any breach of security or unauthorized use of your account.
        </p>
        <p>
          We reserve the right to refuse service, terminate accounts, remove or edit content, or cancel orders in our sole discretion.
        </p>
        <hr />

        <h4 className="mt-4 mb-2 fw-bold">3. Copyright Policy</h4>
        <p>
          We respect the intellectual property rights of others. It is our policy to respond to any claim that Content posted on the Service infringes
          on the copyright or other intellectual property rights (“Infringement”) of any person or entity.
        </p>
        <p>
          If you are a copyright owner, or authorized on behalf of one, and you believe that the copyrighted work has been copied in a way that constitutes copyright infringement,
          please submit your claim via email to <a href="mailto:info@asvab-tutoring.com">info@asvab-tutoring.com</a>,
          with the subject line: “Copyright Infringement” and include in your claim a detailed description of the alleged Infringement as detailed below,
          under “DMCA Notice and Procedure for Copyright Infringement Claims”.
        </p>
        <p>
          You may be held accountable for damages (including costs and attorneys’ fees) for misrepresentation or bad-faith claims on the infringement of any Content found on and/or through the Service on your copyright.
        </p>
        <hr />

        <h4 className="mt-4 mb-2 fw-bold">4. Intellectual Property</h4>
        <p>
          The Service and its original content, features and functionality are and will remain the exclusive property of ASVAB Tutoring, LLC. and its licensors.
          The Service is protected by copyright, trademark, and other laws of both the United States and foreign countries.
          Our trademarks and trade dress may not be used in connection with any product or service without the prior written consent of ASVAB Tutoring, LLC.
        </p>

        <h4 className="mt-4 mb-2 fw-bold">5. Termination</h4>
        <p>
          We may terminate or suspend your account and bar access to the Service immediately, without prior notice or liability, under our sole discretion,
          for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.
        </p>
        <p>
          If you wish to terminate your account, you may simply discontinue using the Service.
        </p>
        <p>
          All provisions of the Terms which by their nature should survive termination shall survive termination,
          including, without limitation, ownership provisions, warranty disclaimers, indemnity and limitations of liability.
        </p>
        <hr />

        <h4 className="mt-4 mb-2 fw-bold">6. Changes</h4>
        <p>
          We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
          If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
          What constitutes a material change will be determined at our sole discretion.
        </p>
        <p>
          By continuing to access or use our Service after any revisions become effective, you agree to be bound by the revised terms.
          If you do not agree to the new terms, you are no longer authorized to use the Service.
        </p>

        <h4 className="mt-4 mb-2 fw-bold">7. Contact Us</h4>
        <p>
          If you have any questions about these Terms, please contact us:{" "}
          <a className="text-primary" href="mailto:info@asvab-tutoring.com">info@asvab-tutoring.com</a>
        </p>
      </div>
    </section>
  );
}
