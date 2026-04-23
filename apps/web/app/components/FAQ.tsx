'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

const faqs = [
  {
    question: 'Do you deliver in Multan?',
    answer: 'Yes, we proudly offer delivery services all across Multan. No matter which area you\'re located in, we make sure your food reaches you fresh, on time, and in perfect condition.',
  },
  {
    question: 'Are your ingredients homemade and hygienic?',
    answer: 'Absolutely! We use only homemade ingredients that are prepared with great care and cleanliness. Our food is made in a hygienic environment, ensuring both quality and health for our customers.',
  },
  {
    question: 'Do you offer delivery service?',
    answer: 'Yes, we provide a reliable delivery service for all orders. Our goal is to make the process easy and convenient for you, so you can enjoy delicious homemade food without any hassle.',
  },
  {
    question: 'How can I place an order?',
    answer: 'You can easily place your order by contacting us through our website or WhatsApp. Just send us your details and order, and we\'ll take care of the rest.',
  },
]

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index)
  }

  return (
    <section className="bg-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
          Frequently Asked Questions
        </h2>
        
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-xl overflow-hidden transition-all"
            >
              <button
                onClick={() => toggleFAQ(index)}
                className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-sm text-teal-500 pr-4">
                  Q: {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 text-teal-500 flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`}
                />
              </button>
              
              <div
                className={`overflow-hidden transition-all duration-300 ${
                  openIndex === index ? 'max-h-96' : 'max-h-0'
                }`}
              >
                <div className="p-4 pt-0 text-sm text-gray-700 leading-relaxed">
                  <span className="font-semibold text-black">A:</span> {faq.answer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
