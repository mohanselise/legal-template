import Link from 'next/link';
import Image from 'next/image';
import { Metadata } from 'next';
import { CheckCircle2, Clock, Shield, FileText, Users, Briefcase, Scale, AlertCircle } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Employment Agreement Template | Free Legal Contract Generator',
  description: 'Create professional employment agreements in minutes. Legally sound, customizable templates for full-time, part-time, and contract employees. No lawyer required.',
  keywords: 'employment agreement, employment contract, job contract template, employee agreement, work contract, hiring agreement',
  openGraph: {
    title: 'Employment Agreement Template | Free Legal Contract Generator',
    description: 'Create professional employment agreements in minutes. Legally sound, customizable templates.',
    type: 'website',
  },
};

export default function EmploymentAgreementPage() {
  return (
    <div className="bg-[hsl(var(--bg))]">
      {/* Hero Section - Above the Fold */}
      <section className="relative bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] text-white overflow-hidden">
        {/* Background Pattern/Image */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] bg-repeat"></div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-8 items-center">
            <div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Create Professional Employment Agreements in Minutes
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-blue-100">
                Generate legally sound employment contracts tailored to your needs. No lawyer required. Save time and money with our trusted template generator.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link
                  href="/templates/employment-agreement/generate"
                  className="inline-flex items-center justify-center rounded-lg bg-white px-8 py-4 text-lg font-semibold text-[hsl(222,89%,52%)] shadow-lg hover:bg-blue-50 transition-all transform hover:scale-105"
                >
                  Generate Your Agreement Now
                  <FileText className="ml-2 h-5 w-5" />
                </Link>

                <Link
                  href="#how-it-works"
                  className="inline-flex items-center justify-center rounded-lg border-2 border-white px-8 py-4 text-lg font-semibold text-white hover:bg-white/10 transition-all"
                >
                  See How It Works
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  <span>Legally vetted templates</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  <span>Ready in 5 minutes</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-300" />
                  <span>Fully customizable</span>
                </div>
              </div>
            </div>

            {/* Trust Indicators with Visual */}
            <div className="relative bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              {/* Decorative illustration - using abstract shapes */}
              <div className="absolute top-4 right-4 opacity-20">
                <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="10" y="10" width="30" height="40" rx="4" fill="white" opacity="0.6"/>
                  <rect x="45" y="20" width="30" height="35" rx="4" fill="white" opacity="0.4"/>
                  <rect x="25" y="55" width="50" height="8" rx="2" fill="white" opacity="0.8"/>
                  <rect x="25" y="68" width="40" height="8" rx="2" fill="white" opacity="0.6"/>
                  <rect x="25" y="81" width="45" height="8" rx="2" fill="white" opacity="0.4"/>
                </svg>
              </div>

              <h3 className="text-xl font-semibold mb-6">What&apos;s Included:</h3>
              <ul className="space-y-4">
                {[
                  'Job title and description',
                  'Compensation and benefits',
                  'Working hours and location',
                  'Confidentiality clauses',
                  'Termination conditions',
                  'Non-compete agreements',
                  'Intellectual property rights',
                  'Dispute resolution terms'
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-green-300 flex-shrink-0 mt-0.5" />
                    <span className="text-blue-50">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why You Need an Employment Agreement */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--fg))] mb-4">
              Why Every Employer Needs a Written Employment Agreement
            </h2>
            <p className="text-lg text-[hsl(var(--brand-muted))]">
              Protect your business and create clear expectations from day one
            </p>
          </div>

          <div className="prose prose-lg max-w-none text-[hsl(var(--fg))]">
            <p>
              An employment agreement is more than just a formality—it's a critical legal document that protects both employers and employees. Whether you're hiring your first employee or your hundredth, having a clear, written agreement prevents misunderstandings and provides legal protection.
            </p>

            <p>
              Without a proper employment agreement, you risk costly disputes over compensation, job responsibilities, intellectual property ownership, and termination conditions. A well-drafted contract sets clear expectations and provides a framework for resolving issues before they escalate.
            </p>

            <div className="grid gap-6 sm:grid-cols-2 not-prose my-12">
              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6">
                <Shield className="h-10 w-10 text-[hsl(var(--brand-primary))] mb-4" />
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">Legal Protection</h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  Safeguard your business interests with enforceable confidentiality, non-compete, and IP clauses.
                </p>
              </div>

              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6">
                <Users className="h-10 w-10 text-[hsl(var(--brand-primary))] mb-4" />
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">Clear Expectations</h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  Define roles, responsibilities, and performance standards to prevent future disputes.
                </p>
              </div>

              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6">
                <Briefcase className="h-10 w-10 text-[hsl(var(--brand-primary))] mb-4" />
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">Professional Image</h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  Show candidates you're a serious, organized employer who values proper documentation.
                </p>
              </div>

              <div className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6">
                <Scale className="h-10 w-10 text-[hsl(var(--brand-primary))] mb-4" />
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">Compliance</h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  Ensure your agreements meet legal requirements and industry standards.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-[hsl(var(--card))] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--fg))] mb-4">
              Generate Your Employment Agreement in 3 Simple Steps
            </h2>
            <p className="text-lg text-[hsl(var(--brand-muted))]">
              No legal expertise required. Our guided process makes it easy.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--brand-primary))] text-white flex items-center justify-center text-2xl font-bold mb-6">
                1
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-3">
                Answer Simple Questions
              </h3>
              <p className="text-[hsl(var(--brand-muted))]">
                Tell us about the position, compensation, and key terms. Our guided form walks you through every detail.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--brand-primary))] text-white flex items-center justify-center text-2xl font-bold mb-6">
                2
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-3">
                Review Your Document
              </h3>
              <p className="text-[hsl(var(--brand-muted))]">
                Instantly see your customized agreement. Make edits, add clauses, or adjust terms as needed.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[hsl(var(--brand-primary))] text-white flex items-center justify-center text-2xl font-bold mb-6">
                3
              </div>
              <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-3">
                Download & Sign
              </h3>
              <p className="text-[hsl(var(--brand-muted))]">
                Download in PDF or Word format. Ready to print, sign, and use immediately.
              </p>
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/templates/employment-agreement/generate"
              className="inline-flex items-center justify-center rounded-lg bg-[hsl(var(--brand-primary))] px-8 py-4 text-lg font-semibold text-white shadow-lg hover:opacity-90 transition-all transform hover:scale-105"
            >
              Start Creating Your Agreement
              <FileText className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Key Clauses Explained */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--fg))] mb-4">
              Essential Clauses in Every Employment Agreement
            </h2>
            <p className="text-lg text-[hsl(var(--brand-muted))]">
              Understanding the building blocks of a strong contract
            </p>
          </div>

          <div className="space-y-6">
            {[
              {
                title: 'Job Description & Duties',
                description: 'Clearly defines the role, responsibilities, reporting structure, and performance expectations. Prevents scope creep and disputes about job requirements.'
              },
              {
                title: 'Compensation & Benefits',
                description: 'Specifies salary, bonuses, commission structure, benefits, equity, and payment schedule. Includes provisions for raises and performance reviews.'
              },
              {
                title: 'Work Schedule & Location',
                description: 'Outlines working hours, remote work policies, overtime expectations, and physical work location. Critical for hybrid and remote arrangements.'
              },
              {
                title: 'Confidentiality & Non-Disclosure',
                description: 'Protects sensitive business information, trade secrets, client lists, and proprietary data. Enforceable during and after employment.'
              },
              {
                title: 'Intellectual Property Rights',
                description: 'Clarifies who owns work products, inventions, and creative output. Essential for tech companies and creative industries.'
              },
              {
                title: 'Non-Compete & Non-Solicitation',
                description: 'Prevents employees from joining competitors or poaching clients/staff after leaving. Must be reasonable in scope and duration.'
              },
              {
                title: 'Termination Conditions',
                description: 'Defines at-will employment status, notice periods, severance terms, and grounds for immediate dismissal. Protects both parties.'
              },
              {
                title: 'Dispute Resolution',
                description: 'Establishes how conflicts will be resolved—through arbitration, mediation, or court. Includes jurisdiction and governing law.'
              }
            ].map((clause, index) => (
              <div key={index} className="bg-[hsl(var(--card))] border border-[hsl(var(--border))] rounded-lg p-6">
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[hsl(var(--brand-primary))]" />
                  {clause.title}
                </h3>
                <p className="text-[hsl(var(--brand-muted))]">{clause.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="bg-[hsl(var(--card))] py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--fg))] mb-4">
              Perfect For Every Hiring Scenario
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[
              { title: 'Startups', desc: 'Hiring your first employees with equity and vesting schedules' },
              { title: 'Small Businesses', desc: 'Bringing on full-time or part-time staff with clear terms' },
              { title: 'Remote Companies', desc: 'Managing distributed teams across different jurisdictions' },
              { title: 'Contractors', desc: 'Converting freelancers to full-time employees' },
              { title: 'C-Suite Executives', desc: 'Executive agreements with complex compensation packages' },
              { title: 'International Hires', desc: 'Cross-border employment with compliance considerations' }
            ].map((useCase, index) => (
              <div key={index} className="bg-white border border-[hsl(var(--border))] rounded-lg p-6">
                <h3 className="text-lg font-semibold text-[hsl(var(--fg))] mb-2">{useCase.title}</h3>
                <p className="text-[hsl(var(--brand-muted))] text-sm">{useCase.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social Proof / Stats Section */}
      <section className="py-12 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 text-center">
            {[
              { number: '10,000+', label: 'Documents Generated' },
              { number: '98%', label: 'Satisfaction Rate' },
              { number: '< 5 min', label: 'Average Time' },
              { number: '24/7', label: 'Available' }
            ].map((stat, index) => (
              <div key={index} className="flex flex-col items-center">
                <div className="text-4xl font-bold text-[hsl(var(--brand-primary))] mb-2">
                  {stat.number}
                </div>
                <div className="text-sm text-[hsl(var(--brand-muted))]">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--fg))] mb-4">
              Why Choose Our Employment Agreement Generator?
            </h2>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Clock className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">
                  Save Time & Money
                </h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  Lawyers charge $500-$2,000 for employment agreements. Create yours in minutes for a fraction of the cost.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <Shield className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">
                  Legally Sound Templates
                </h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  Our templates are drafted by legal professionals and updated regularly to reflect current laws.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <FileText className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">
                  Fully Customizable
                </h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  Add, remove, or modify clauses to fit your specific situation. Every business is unique.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <CheckCircle2 className="h-8 w-8 text-[hsl(var(--brand-primary))]" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-[hsl(var(--fg))] mb-2">
                  Plain English
                </h3>
                <p className="text-[hsl(var(--brand-muted))]">
                  No confusing legalese. Our agreements are written in clear, understandable language.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-[hsl(var(--card))] py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold text-[hsl(var(--fg))] mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="space-y-6">
            {[
              {
                q: 'Is this employment agreement legally binding?',
                a: 'Yes, our templates create legally binding agreements when properly executed by both parties. However, we recommend having any contract reviewed by a local attorney to ensure it complies with your jurisdiction\'s specific requirements.'
              },
              {
                q: 'Can I use this for remote employees in other states or countries?',
                a: 'Our templates can be customized for remote workers, but employment laws vary significantly by jurisdiction. For international hires or multi-state employment, we strongly recommend consulting with an employment lawyer to ensure compliance.'
              },
              {
                q: 'What\'s the difference between an employment agreement and an offer letter?',
                a: 'An offer letter is a preliminary document outlining basic terms. An employment agreement is a comprehensive legal contract that details all aspects of the employment relationship, including confidentiality, IP rights, and termination conditions.'
              },
              {
                q: 'How do I handle non-compete clauses?',
                a: 'Non-compete enforceability varies by state. Our template includes customizable non-compete language, but some states heavily restrict or ban these clauses. Check your local laws or consult an attorney.'
              },
              {
                q: 'Can I modify the agreement after it\'s signed?',
                a: 'Yes, but any changes require mutual consent from both employer and employee. Changes should be documented in writing as amendments to the original agreement.'
              },
              {
                q: 'Do I need separate agreements for part-time vs full-time employees?',
                a: 'Our template can be customized for both full-time and part-time positions. The key differences are usually in benefits eligibility and work hours, which you can specify during the generation process.'
              }
            ].map((faq, index) => (
              <details key={index} className="group bg-white border border-[hsl(var(--border))] rounded-lg p-6">
                <summary className="font-semibold text-[hsl(var(--fg))] cursor-pointer list-none flex items-center justify-between">
                  <span>{faq.q}</span>
                  <span className="ml-4 flex-shrink-0 text-[hsl(var(--brand-primary))]">+</span>
                </summary>
                <p className="mt-4 text-[hsl(var(--brand-muted))]">{faq.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Important Disclaimer */}
      <section className="py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-r-lg">
            <div className="flex gap-3">
              <AlertCircle className="h-6 w-6 text-amber-600 flex-shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-amber-900 mb-2">Important Legal Notice</h3>
                <p className="text-sm text-amber-800">
                  This template is provided for informational purposes and should not be considered legal advice. Employment laws vary by jurisdiction, industry, and specific circumstances. While our templates are drafted to be comprehensive and legally sound, we strongly recommend having any employment agreement reviewed by a qualified attorney in your area before use, especially for executive positions, international hires, or situations involving complex compensation structures.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-br from-[hsl(222,89%,52%)] to-[hsl(262,83%,58%)] text-white py-16 sm:py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Ready to Create Your Employment Agreement?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of employers who trust our platform for their hiring needs
          </p>

          <Link
            href="/templates/employment-agreement/generate"
            className="inline-flex items-center justify-center rounded-lg bg-white px-10 py-5 text-lg font-semibold text-[hsl(222,89%,52%)] shadow-xl hover:bg-blue-50 transition-all transform hover:scale-105"
          >
            Generate Your Agreement Now
            <FileText className="ml-2 h-6 w-6" />
          </Link>

          <p className="mt-6 text-sm text-blue-200">
            No credit card required • Ready in 5 minutes • Download instantly
          </p>
        </div>
      </section>
    </div>
  );
}
