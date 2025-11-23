import React from 'react';
import {
  SignupIllustration,
  ListItemIllustration,
  NotifyIllustration,
} from './HowItWorksIllustrations';

export default function HowItWorks() {
  const steps = [
    {
      title: 'Create an account',
      text: 'Initially, you have to create an account to get started.',
      illustration: <SignupIllustration />,
      cta: { label: 'Sign Up', href: '#signup' },
    },
    {
      title: 'List Lost/Found Item',
      text: 'List your item on the wall by filling certain details and image. That’s it!',
      illustration: <ListItemIllustration />,
    },
    {
      title: 'Get Notified',
      text: 'Once anyone posts an item, we notify registered users right away.',
      illustration: <NotifyIllustration />,
    },
  ];

  return (
    <section className="mt-16 mb-20 bg-white" aria-labelledby="how-it-works-heading">
      <div className="max-w-6xl mx-auto px-6">
        <h2 id="how-it-works-heading" className="text-center text-2xl md:text-3xl font-bold tracking-wide text-[#271c66]">
          HOW IT WORKS ?
        </h2>
        <div className="mt-10 flex flex-col md:flex-row md:items-stretch gap-6 md:gap-8" role="list">
          {steps.map((step) => (
            <div
              key={step.title}
              role="listitem"
              className="bg-white rounded-3xl shadow-md border border-gray-100 p-8 flex flex-col items-center text-center hover:shadow-xl transition md:flex-1"
            >
              <div className="w-full max-w-[220px] mb-6">{step.illustration}</div>
              <h3 className="text-lg font-semibold text-[#1d1b43]">{step.title}</h3>
              <p className="mt-3 text-sm text-gray-600 leading-relaxed">{step.text}</p>
              {step.cta && (
                <a
                  href={step.cta.href}
                  className="mt-5 inline-flex items-center justify-center px-6 py-2 rounded-full bg-[#35218d] text-white text-sm font-semibold shadow hover:bg-[#4a33c0]"
                >
                  {step.cta.label}
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
