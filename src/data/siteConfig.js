export const initialSiteConfig = {
  flashSaleText: "🔥 FLAT 50% OFF on all Bridal Collections! Use Code: BRIDE50 | Free Shipping on orders above ₹2999 | 🎁 Extra 10% OFF for First Time Users!",

  // Homepage Section Titles (editable from admin)
  sectionTitles: {
    topSelling: {
      title: 'Top Selling',
      subtitle: 'Our most loved pieces by customers'
    },
    featured: {
      title: 'Featured Collection',
      subtitle: 'Handpicked premium pieces for you'
    },
    whyChooseUs: {
      title: 'Why Choose Us',
      subtitle: ''
    }
  },

  // Carousel Settings (Home Page)
  carouselSettings: {
    // Hero Banner Carousel
    heroBannerAutoPlay: true,
    heroBannerSpeed: 5000, // milliseconds
    // Top Selling Carousel
    topSellingAutoPlay: true,
    topSellingSpeed: 3000, // milliseconds
    topSellingItemsToShow: 8, // max items to display
    // Featured Collection Carousel
    featuredAutoPlay: true,
    featuredSpeed: 3500, // milliseconds
    featuredItemsToShow: 8, // max items to display
    // Parallax Section
    parallaxAutoPlay: true,
    parallaxSpeed: 5000, // milliseconds
  },

  // Product Sizes Configuration
  productSizes: {
    // Women's categories
    blouses: ['S', 'M', 'L', 'XL', 'XXL'],
    sarees: ['Free Size'],
    kurtis: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    lehengas: ['S', 'M', 'L', 'XL'],
    // Kids categories
    'kids-frocks': ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    'kids-lehengas': ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    'kids-gowns': ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    'kids-ethnic': ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    'kids-party': ['2-3Y', '4-5Y', '6-7Y', '8-9Y', '10-11Y', '12-13Y'],
    // Fashion categories
    ornaments: ['Adjustable', 'Fixed Size'],
    handbags: ['Small', 'Medium', 'Large'],
    clutches: ['Standard'],
    jewelry: ['Adjustable', 'Fixed Size'],
    scarves: ['Standard', 'Long', 'Square'],
    belts: ['S', 'M', 'L', 'XL', 'Free Size']
  },

  // Delivery Settings
  deliverySettings: {
    freeShippingThreshold: 2999,
    standardDeliveryDays: '5-7',
    expressDeliveryDays: '2-3',
    codAvailable: true,
    returnDays: 7
  },

  // Trust Badges / Store Features (editable from admin)
  trustBadges: [
    { id: 1, icon: '🚚', title: 'Free Shipping', description: 'On orders above ₹2999', enabled: true },
    { id: 2, icon: '↩️', title: 'Easy Returns', description: '7-day return policy', enabled: true },
    { id: 3, icon: '🔒', title: 'Secure Payment', description: '100% secure checkout', enabled: true },
    { id: 4, icon: '💎', title: 'Premium Quality', description: 'Handpicked fabrics', enabled: true }
  ],

  // Shipping Zones (for delivery estimation)
  shippingZones: {
    metro: ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'],
    tier1: ['Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Chandigarh'],
    tier2: [] // All other cities
  },

  bannerImages: [
    {
      id: 1,
      video: "/Panel%20videos/1.mp4",
      label: "New Collection",
      title: "New Arrivals",
      subtitle: "Discover Our Latest Collection",
      buttonText: "Shop Now",
      link: "/women"
    },
    {
      id: 2,
      video: "/Panel%20videos/2.mp4",
      label: "New Collection",
      title: "Bridal Collection",
      subtitle: "Make Your Special Day Unforgettable",
      buttonText: "Explore",
      link: "/women?category=lehengas"
    },
    {
      id: 3,
      video: "/Panel%20videos/3.mp4",
      label: "New Collection",
      title: "Festive Season Sale",
      subtitle: "Up to 40% Off on Selected Items",
      buttonText: "View Offers",
      link: "/women"
    }
  ],

  contactPhone: "+91 98765 43210",
  contactEmail: "support@thisaiboutique.com",
  contactAddress: "123, Fashion Street, Textile Market, Mumbai - 400001, Maharashtra, India",

  aboutStory: `Welcome to ThisAI Boutique, where tradition meets contemporary elegance. Founded in 2020, we have been dedicated to bringing you the finest in Indian ethnic wear.

Our journey began with a simple vision - to make exquisite ethnic fashion accessible to every woman. Today, we proudly serve thousands of customers across India, offering a curated collection of sarees, kurtis, lehengas, and custom-tailored outfits.

Every piece in our collection is carefully selected for its quality, craftsmanship, and timeless appeal. We work directly with skilled artisans and weavers from across India, ensuring that each garment tells a story of heritage and handwork.

At ThisAI Boutique, we believe that every woman deserves to feel beautiful and confident. Whether you're shopping for a wedding, a festival, or everyday elegance, we're here to help you find the perfect outfit that reflects your unique style.`,

  socialLinks: {
    facebook: "https://facebook.com/thisaiboutique",
    instagram: "https://instagram.com/thisaiboutique",
    twitter: "https://twitter.com/thisaiboutique",
    pinterest: "https://pinterest.com/thisaiboutique"
  },

  businessHours: {
    weekdays: "10:00 AM - 8:00 PM",
    saturday: "10:00 AM - 6:00 PM",
    sunday: "Closed"
  },

  // Service Page Content (Admin Controlled)
  servicePageContent: {
    // Hero Section
    hero: {
      badge: "Custom Tailoring",
      title: "Crafted With Precision, Designed For You",
      subtitle: "Experience the art of bespoke tailoring. Our master craftsmen create stunning blouses and kurtis that fit you perfectly.",
      backgroundImage: "/images/blouses/10.jpeg"
    },
    // Parallax Sections (Full page parallax effect)
    parallaxSections: [
      {
        id: 'blouse-stitching',
        title: "Blouse Stitching",
        subtitle: "Perfect Fit, Elegant Design",
        description: "From traditional silk blouses to contemporary designer pieces, we craft each blouse with meticulous attention to detail. Our expert tailors ensure every stitch is perfect.",
        features: ["Custom Measurements", "Designer Patterns", "Premium Finishing", "Quick Turnaround"],
        image: "/images/blouses/15.jpeg",
        enabled: true
      },
      {
        id: 'kurti-tailoring',
        title: "Kurti Tailoring",
        subtitle: "Comfort Meets Style",
        description: "Discover the perfect blend of comfort and elegance with our custom kurti tailoring. From everyday casual to festive occasions, we create kurtis that reflect your personal style.",
        features: ["Modern Designs", "Traditional Patterns", "All Sizes Available", "Fabric Selection"],
        image: "/images/kurtis/5.jpeg",
        enabled: true
      },
      {
        id: 'custom-design',
        title: "Custom Designs",
        subtitle: "Your Vision, Our Expertise",
        description: "Have a design in mind? Share your inspiration, and our skilled artisans will bring it to life. We specialize in creating unique pieces that are exclusively yours.",
        features: ["Reference Based Design", "Fabric Consultation", "Multiple Fittings", "Alterations Included"],
        image: "/images/blouses/20.jpeg",
        enabled: true
      },
      {
        id: 'alterations',
        title: "Expert Alterations",
        subtitle: "Revive Your Favorites",
        description: "Give your cherished outfits a new life. Our alteration services ensure your existing blouses and kurtis fit perfectly, just like new.",
        features: ["Size Adjustments", "Style Updates", "Repair & Restore", "Same Day Service"],
        image: "/images/kurtis/12.jpeg",
        enabled: true
      }
    ],
    // Gallery Section
    gallery: {
      title: "Our Creations",
      subtitle: "Handcrafted with love and precision",
      images: [
        { id: 1, image: "/images/blouses/25.jpeg", label: "Designer Blouse" },
        { id: 2, image: "/images/kurtis/3.jpeg", label: "Festive Kurti" },
        { id: 3, image: "/images/blouses/30.jpeg", label: "Bridal Blouse" },
        { id: 4, image: "/images/kurtis/8.jpeg", label: "Casual Kurti" },
        { id: 5, image: "/images/blouses/35.jpeg", label: "Party Blouse" },
        { id: 6, image: "/images/kurtis/15.jpeg", label: "Embroidered Kurti" }
      ]
    },
    // Service Types for booking
    serviceTypes: [
      { id: 'blouse', label: 'Blouse Stitching', icon: '👚', price: '₹500 onwards' },
      { id: 'kurti', label: 'Kurti Tailoring', icon: '👗', price: '₹800 onwards' },
      { id: 'designer-blouse', label: 'Designer Blouse', icon: '✨', price: '₹1500 onwards' },
      { id: 'alterations', label: 'Alterations', icon: '🔧', price: '₹200 onwards' },
      { id: 'custom', label: 'Custom Design', icon: '🎨', price: 'On Request' }
    ],
    // Pricing Info
    pricingNote: "Prices may vary based on design complexity and fabric type. Final quote provided after consultation.",
    // Contact Info for booking
    workingHours: "Mon - Sat: 10AM - 8PM",
    contactNumber: "+91 98765 43210"
  },

  // WhatsApp Message Templates (Admin Editable)
  whatsappTemplates: {
    confirmed: "Dear {name}, your appointment for {service} has been confirmed for {date} at {time}. Thank you for choosing ThisAI Boutique! For any queries, call us at {phone}.",
    rescheduled: "Dear {name}, your appointment has been rescheduled to {date} at {time}. We apologize for any inconvenience. Thank you for your understanding!",
    reminder: "Dear {name}, this is a reminder for your appointment tomorrow ({date}) at {time} for {service}. We look forward to seeing you!",
    cancelled: "Dear {name}, we regret to inform you that your appointment for {date} has been cancelled. Please contact us to reschedule at your convenience."
  },

  limitedTimeOffer: {
    title: "Limited Time Offer",
    subtitle: "Exclusive Designer Collection",
    description: "Get flat 30% off on our premium designer lehengas. Limited stock available!",
    image: "/images/ad-banner-bg.jpg",
    validUntil: "2025-01-31"
  },

  // About Page Content (Admin Controlled)
  aboutPageContent: {
    // Hero Section
    hero: {
      badge: "Est. 2014",
      title: "Crafting Elegance,",
      titleHighlight: "Stitch by Stitch",
      subtitle: "Where traditional artistry meets modern fashion. We don't just create clothes, we craft stories that you wear with pride.",
      backgroundImage: "/images/blouses/15.jpeg",
      ctaButtons: [
        { text: "Book Appointment", link: "/service", primary: true },
        { text: "Explore Collection", link: "/women", primary: false }
      ]
    },
    // Story Section
    story: {
      label: "Our Journey",
      title: "From Humble Beginnings to Your Trusted Boutique",
      paragraphs: [
        "What started as a small tailoring corner in 2014 has blossomed into one of the most trusted boutiques for ethnic wear. Our founder, with over 25 years of experience in traditional tailoring, dreamed of creating a space where every woman could find her perfect fit.",
        "Today, ThisAI Boutique stands as a testament to that dream. With a team of 50+ skilled artisans, we specialize in custom blouse stitching, kurti designs, and intricate aari and maggam work that celebrates India's rich textile heritage.",
        "Every piece that leaves our boutique carries the warmth of handcrafted perfection and the promise of timeless elegance."
      ],
      features: ["Custom Measurements", "Handcrafted Details", "Premium Fabrics", "Timely Delivery"],
      backgroundImage: "/images/kurtis/8.jpeg",
      mainImage: "/images/blouses/30.jpeg",
      secondaryImage: "/images/kurtis/15.jpeg",
      experienceBadge: { number: "10+", text: "Years of Excellence" }
    },
    // Stats Section
    stats: {
      title: "Numbers That Speak",
      subtitle: "Our journey in numbers - a testament to trust and quality",
      backgroundImage: "/images/blouses/40.jpeg",
      items: [
        { number: "10+", label: "Years of Excellence", icon: "award", color: "#e91e8c" },
        { number: "5000+", label: "Happy Customers", icon: "users", color: "#4da8da" },
        { number: "50+", label: "Master Artisans", icon: "scissors", color: "#27ae60" },
        { number: "100%", label: "Quality Assured", icon: "heart", color: "#f39c12" }
      ]
    },
    // Specializations Section
    specializations: {
      label: "What We Do Best",
      title: "Our Specializations",
      subtitle: "Expertise honed over years of dedicated craftsmanship",
      items: [
        { title: "Blouse Stitching", image: "/images/blouses/5.jpeg", count: "2000+" },
        { title: "Kurti Designs", image: "/images/kurtis/10.jpeg", count: "1500+" },
        { title: "Aari & Maggam", image: "/images/blouses/25.jpeg", count: "800+" },
        { title: "Bridal Wear", image: "/images/lehengas/1.jpeg", count: "500+" }
      ]
    },
    // Mission Section
    mission: {
      label: "Our Mission",
      title: "To Celebrate Every Woman's Unique Beauty",
      description: "We believe that every woman deserves to feel confident and beautiful in what she wears. Our mission is to create garments that not only fit perfectly but also tell a story - your story. From the first consultation to the final fitting, we're committed to making your fashion dreams a reality.",
      quote: "Fashion is not about following trends. It's about expressing who you are.",
      quoteAuthor: "Founder, ThisAI Boutique",
      backgroundImage: "/images/blouses/20.jpeg"
    },
    // Values Section
    values: {
      label: "What Drives Us",
      title: "Our Core Values",
      subtitle: "The principles that guide every stitch we make",
      items: [
        { icon: "✂️", title: "Precision Tailoring", description: "Every stitch is crafted with meticulous attention to detail by our master tailors." },
        { icon: "🎨", title: "Artistic Design", description: "Blending traditional artistry with contemporary fashion trends." },
        { icon: "💎", title: "Premium Quality", description: "Only the finest fabrics and materials make it to your wardrobe." },
        { icon: "🤝", title: "Personal Touch", description: "Every customer is family. We listen, understand, and deliver perfection." }
      ]
    },
    // Timeline Section
    timeline: {
      label: "Our Journey",
      title: "Milestones",
      subtitle: "Key moments that shaped who we are today",
      items: [
        { year: "2014", title: "The Beginning", description: "Started as a small tailoring shop with just 2 artisans and a dream." },
        { year: "2016", title: "First Expansion", description: "Opened our first boutique store, introducing designer blouses." },
        { year: "2019", title: "Going Digital", description: "Launched online presence to reach customers across India." },
        { year: "2022", title: "Premium Collection", description: "Introduced exclusive bridal and designer ethnic wear line." },
        { year: "2024", title: "Today", description: "A trusted name with 5000+ happy customers and counting." }
      ]
    },
    // CTA Section
    cta: {
      title: "Ready to Experience Bespoke Fashion?",
      subtitle: "Book an appointment today and let us create something beautiful for you.",
      backgroundImage: "/images/kurtis/20.jpeg",
      buttons: [
        { text: "Book Appointment", link: "/service", icon: "scissors", primary: true },
        { text: "Shop Now", link: "/women", primary: false }
      ]
    }
  },

  // Contact Page Content (Admin Controlled)
  contactPageContent: {
    // Hero Section
    hero: {
      badge: "We're Here For You",
      title: "Let's Start a",
      titleHighlight: "Conversation",
      subtitle: "Have questions about our services? Want to discuss a custom design? We'd love to hear from you. Our team is ready to help bring your fashion dreams to life.",
      backgroundImage: "/images/blouses/10.jpeg"
    },
    // Contact Info Cards
    infoCards: [
      { id: 1, icon: "location", title: "Visit Our Boutique", content: "123, Fashion Street, Textile Market, Mumbai - 400001, Maharashtra, India", color: "#e91e8c", enabled: true },
      { id: 2, icon: "phone", title: "Call Us", content: "+91 98765 43210", link: "tel:+919876543210", color: "#4da8da", enabled: true },
      { id: 3, icon: "email", title: "Email Us", content: "support@thisaiboutique.com", link: "mailto:support@thisaiboutique.com", color: "#27ae60", enabled: true },
      { id: 4, icon: "clock", title: "Business Hours", content: "Mon - Sat: 10AM - 8PM | Sunday: Closed", color: "#f39c12", enabled: true }
    ],
    // Form Section
    formSection: {
      title: "Send Us a Message",
      subtitle: "Fill out the form below and we'll get back to you within 24 hours",
      backgroundImage: "/images/kurtis/12.jpeg",
      submitButtonText: "Send Message",
      successTitle: "Message Sent Successfully!",
      successMessage: "Thank you for reaching out. Our team will respond to your inquiry within 24 hours."
    },
    // Map Section
    mapSection: {
      title: "Find Us Here",
      subtitle: "Visit our boutique for a personalized shopping experience",
      description: "Experience our collection in person. Our store offers personalized styling assistance, custom measurements, and expert fashion advice from our dedicated team.",
      embedUrl: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.253308426!2d72.82601871490263!3d18.985456087128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ce6e3c8e3bfd%3A0x7b0a7b0b8d8a0e0!2sCrawford%20Market!5e0!3m2!1sen!2sin!4v1629287389751!5m2!1sen!2sin",
      directionsUrl: "https://maps.google.com/?q=Crawford+Market+Mumbai",
      directionsButtonText: "Get Directions",
      backgroundImage: "/images/blouses/25.jpeg"
    },
    // FAQ Section
    faqSection: {
      title: "Frequently Asked Questions",
      subtitle: "Quick answers to common questions about our services",
      backgroundImage: "/images/kurtis/18.jpeg",
      items: [
        { id: 1, question: "What are your delivery timeframes?", answer: "We deliver within 5-7 business days across India. Express delivery (2-3 days) is available for select pincodes at an additional charge.", enabled: true },
        { id: 2, question: "Do you offer custom tailoring?", answer: "Yes! We specialize in custom blouse stitching, kurti designs, and alterations. Visit our Service page to book an appointment with our master tailors.", enabled: true },
        { id: 3, question: "What is your return policy?", answer: "We offer a 7-day easy return policy for unused items in original packaging with tags intact. Custom-made items are non-returnable but eligible for alterations.", enabled: true },
        { id: 4, question: "How can I track my order?", answer: "Once shipped, you'll receive a tracking link via SMS and email. You can also track your order in the 'My Orders' section of your account.", enabled: true },
        { id: 5, question: "Do you offer bulk orders for events?", answer: "Absolutely! We offer special pricing for bulk orders (10+ pieces) for weddings, corporate events, and family functions. Contact us for a custom quote.", enabled: true },
        { id: 6, question: "Can I visit your store without an appointment?", answer: "Walk-ins are welcome during business hours! However, for custom tailoring consultations, we recommend booking an appointment for dedicated attention.", enabled: true }
      ]
    },
    // CTA Section
    cta: {
      title: "Ready to Create Something Beautiful?",
      subtitle: "Book a consultation with our expert stylists and tailors",
      backgroundImage: "/images/lehengas/1.jpeg",
      primaryButton: { text: "Book Appointment", link: "/service" },
      secondaryButton: { text: "View Collections", link: "/women" }
    },
    // Social Media Links
    socialLinks: {
      title: "Connect With Us",
      subtitle: "Follow us for the latest designs, offers, and fashion inspiration",
      items: [
        { id: 1, platform: "facebook", url: "https://facebook.com/thisaiboutique", enabled: true },
        { id: 2, platform: "instagram", url: "https://instagram.com/thisaiboutique", enabled: true },
        { id: 3, platform: "twitter", url: "https://twitter.com/thisaiboutique", enabled: true },
        { id: 4, platform: "pinterest", url: "https://pinterest.com/thisaiboutique", enabled: true },
        { id: 5, platform: "youtube", url: "https://youtube.com/thisaiboutique", enabled: true }
      ]
    }
  },

  // Promo card (single panel) for Women, Kids, Fashion sections
  promoCards: {
    women: { id: 1, title: 'Lehenga Collection', subtitle: 'Be the Showstopper', offer: 'FLAT 50% OFF', badge: 'EXCLUSIVE', image: '/images/lehengas/1.jpeg', animation: 'confetti', buttonText: 'Explore Now', link: '/women?category=lehengas', active: true, featured: true, position: 1 },
    kids: { id: 2, title: 'Party Wear', subtitle: 'Make Them Shine', offer: 'FLAT 35% OFF', badge: 'PARTY', image: '/images/kids-lehengas/1.jpeg', animation: 'sparkle', buttonText: 'Shop Now', link: '/kids?category=kids-lehengas', active: true, featured: true, position: 1 },
    fashion: { id: 3, title: 'Ornaments', subtitle: 'Complete Your Look', offer: 'Up to 30% OFF', badge: 'TRENDING', image: '/images/ornaments/1.jpeg', animation: 'sparkle', buttonText: 'Shop Now', link: '/fashion?category=ornaments', active: true, featured: true, position: 1 }
  },

  // Parallax Category Section (Home Page)
  parallaxCategories: [
    {
      id: 'women',
      name: 'Women Collection',
      subtitle: 'Elegant & Timeless',
      description: 'Discover our exquisite range of traditional and contemporary wear',
      link: '/women',
      color: '#e91e8c',
      enabled: true,
      // Subcategory cards (max 6 per category)
      cards: [
        { id: 'blouses', label: 'Blouses', image: '/images/blouses/1.png', enabled: true },
        { id: 'sarees', label: 'Sarees', image: '/images/sarees/1.jpeg', enabled: true },
        { id: 'kurtis', label: 'Kurtis', image: '/images/kurtis/1.jpeg', enabled: true },
        { id: 'lehengas', label: 'Lehengas', image: '/images/lehengas/1.jpeg', enabled: true }
      ]
    },
    {
      id: 'kids',
      name: 'Kids Collection',
      subtitle: 'Adorable & Trendy',
      description: 'Cute and comfortable clothing for your little ones',
      link: '/kids',
      color: '#ff6b6b',
      enabled: true,
      cards: [
        { id: 'kids-frocks', label: 'Frocks', image: '/images/kids-frocks/1.jpeg', enabled: true },
        { id: 'kids-lehengas', label: 'Lehengas', image: '/images/kids-lehengas/1.jpeg', enabled: true },
        { id: 'kids-ethnic', label: 'Ethnic', image: '/images/kids-ethnic/1.jpeg', enabled: true }
      ]
    },
    {
      id: 'fashion',
      name: 'Fashion Accessories',
      subtitle: 'Style & Elegance',
      description: 'Complete your look with our stunning accessories',
      link: '/fashion',
      color: '#ff8c42',
      enabled: true,
      cards: [
        { id: 'ornaments', label: 'Ornaments', image: '/images/ornaments/1.jpeg', enabled: true },
        { id: 'handbags', label: 'Handbags', image: '/images/handbags/1.jpeg', enabled: true },
        { id: 'jewelry', label: 'Jewelry', image: '/images/jewelry/1.jpeg', enabled: true }
      ]
    }
  ]
}
