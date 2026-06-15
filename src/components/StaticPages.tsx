import React from 'react';
import './StaticPages.css';

const StaticPageLayout = ({ title, children }: { title: string, children: React.ReactNode }) => (
  <main className="static-page">
    <div className="container">
      <div className="static-page-card">
        <h1>{title}</h1>
        <div className="static-content">
          {children}
        </div>
      </div>
    </div>
  </main>
);

export const AboutPage = () => (
  <StaticPageLayout title="About Us">
    <p>Welcome to Quoteshub! We are a community-driven platform dedicated to collecting, sharing, and discovering the most inspiring, thought-provoking, and memorable quotes from around the world.</p>
    <p>Our mission is to provide a clean, beautiful, and distraction-free environment where words can shine. Whether you're looking for daily motivation, profound wisdom, or simply a clever quip to share with friends, Quoteshub is your go-to destination.</p>
    <h2>Our Story</h2>
    <p>Quoteshub started as a simple idea: a minimalist space to save favorite quotes. Today, it has grown into a vibrant platform where readers and thinkers curate collections of insight.</p>
  </StaticPageLayout>
);

export const ContactPage = () => (
  <StaticPageLayout title="Contact Us">
    <p>We'd love to hear from you! Whether you have a question about the platform, feedback to share, or need assistance, our team is here to help.</p>
    <div className="contact-info">
      <h3>Get in Touch</h3>
      <p><strong>Email:</strong> <a href="mailto:thequoteshubteam@gmail.com">thequoteshubteam@gmail.com</a></p>
      <p>We aim to respond to all inquiries within 24-48 hours.</p>
    </div>
  </StaticPageLayout>
);

export const PrivacyPolicyPage = () => (
  <StaticPageLayout title="Privacy Policy">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <p>Your privacy is important to us. It is Quoteshub's policy to respect your privacy regarding any information we may collect from you across our website.</p>
    
    <h2>1. Information We Collect</h2>
    <p>We only ask for personal information when we truly need it to provide a service to you. We collect it by fair and lawful means, with your knowledge and consent. Information collected may include your name, email address, and profile biography.</p>
    
    <h2>2. Use of Information</h2>
    <p>We use the information we collect to provide, maintain, and improve our services, as well as to communicate with you.</p>

    <h2>3. Cookies</h2>
    <p>We use cookies and similar tracking technologies to track the activity on our service and hold certain information, primarily for authenticating your sessions and keeping you logged in.</p>
  </StaticPageLayout>
);

export const TermsPage = () => (
  <StaticPageLayout title="Terms of Service">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <p>By accessing the website at Quoteshub, you are agreeing to be bound by these terms of service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.</p>
    
    <h2>1. User Content</h2>
    <p>You retain your rights to any content you submit, post or display on or through Quoteshub. By submitting, posting or displaying content, you grant us a worldwide, non-exclusive, royalty-free license to use, copy, reproduce, process, adapt, modify, publish, transmit, display and distribute such content.</p>
    
    <h2>2. Acceptable Use</h2>
    <p>You agree not to engage in any of the following prohibited activities:</p>
    <ul>
      <li>Copying, distributing, or disclosing any part of the service in any medium.</li>
      <li>Transmitting spam, chain letters, or other unsolicited email.</li>
      <li>Attempting to interfere with, compromise the system integrity or security of the platform.</li>
    </ul>
  </StaticPageLayout>
);

export const DisclaimerPage = () => (
  <StaticPageLayout title="Disclaimer">
    <p>The materials on Quoteshub's website are provided on an 'as is' basis. Quoteshub makes no warranties, expressed or implied, and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>
    
    <h2>Content Accuracy</h2>
    <p>The quotes, attributions, and sources provided on this platform are generated and curated by our users. While we strive to maintain a high standard of quality, Quoteshub does not warrant or make any representations concerning the accuracy, likely results, or reliability of the use of the materials on its website or otherwise relating to such materials.</p>
  </StaticPageLayout>
);

export const CookiePolicyPage = () => (
  <StaticPageLayout title="Cookie Policy">
    <p>Last updated: {new Date().toLocaleDateString()}</p>
    <p>This Cookie Policy explains how Quoteshub uses cookies and similar technologies to recognize you when you visit our website. It explains what these technologies are and why we use them, as well as your rights to control our use of them.</p>

    <h2>What are cookies?</h2>
    <p>Cookies are small data files that are placed on your computer or mobile device when you visit a website. Cookies are widely used by website owners in order to make their websites work, or to work more efficiently, as well as to provide reporting information.</p>

    <h2>Why do we use cookies?</h2>
    <p>We use essential cookies to maintain your active session, authenticate you when you log in, and ensure the platform functions securely. Without these cookies, the core functionality of Quoteshub (like saving your favorite quotes) cannot be provided.</p>
  </StaticPageLayout>
);

export const FAQPage = () => (
  <StaticPageLayout title="Frequently Asked Questions">
    <h2>General</h2>
    <h3>What is Quoteshub?</h3>
    <p>Quoteshub is a minimalist, community-driven platform designed to let you save, discover, and share your favorite quotes without the clutter of traditional social media.</p>

    <h3>Is it free to use?</h3>
    <p>Yes, Quoteshub is completely free to use. You can read, like, save, and share quotes at no cost.</p>

    <h2>Account & Content</h2>
    <h3>How do I share a quote?</h3>
    <p>Once you create an account and log in, you'll see a floating 'Pen' button (or a button in the navigation bar) that allows you to easily post a new quote.</p>

    <h3>Can I edit or delete my quotes?</h3>
    <p>Yes! As the author of a quote, you can click the three-dot menu on any of your quote cards to either edit the text or permanently delete it from the platform.</p>
  </StaticPageLayout>
);
