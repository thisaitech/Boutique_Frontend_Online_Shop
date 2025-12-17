import { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { motion, AnimatePresence } from 'framer-motion'
import { FiSave, FiRefreshCw, FiMessageSquare, FiPhone, FiImage, FiFileText, FiTruck, FiShield, FiLayers, FiEdit2, FiSliders, FiPlay, FiPause, FiPlus, FiTrash2, FiGrid, FiChevronDown, FiChevronUp, FiCheck, FiX, FiMapPin, FiHeart } from 'react-icons/fi'
import {
  adminUpdateSiteConfig,
  
} from '../../store/slices/adminSlice'
import { fetchPublicConfig, selectSiteConfig } from '../../store/slices/siteConfigSlice'
import { fetchProducts, selectProducts } from '../../store/slices/productSlice'
import ImageUpload from '../../components/ImageUpload/ImageUpload'
import { uploadImageToS3, deleteImageFromS3, isBase64Image, isS3Image, isS3Video, deleteVideoFromS3 } from '../../utils/imageUtils'
import VideoUpload from '../../components/VideoUpload/VideoUpload'
import toast from 'react-hot-toast'
import './AdminPages.css'
import '../../components/ImageUpload/ImageUpload.css'
import '../../components/VideoUpload/VideoUpload.css'

// Subcategory options - static category lists for admin form
const womenCategories = ['sarees', 'lehengas', 'kurtis', 'blouses']
const kidsCategories = ['kids-frocks', 'kids-lehengas', 'kids-gowns', 'kids-ethnic', 'kids-party']
const fashionCategories = ['handbags', 'clutches', 'jewelry', 'ornaments', 'scarves', 'belts']

const subcategoryOptions = {
  women: womenCategories,
  kids: kidsCategories,
  fashion: fashionCategories
}

function SiteContent() {
  const dispatch = useDispatch()

  // Redux state - no context fallback
  const siteConfig = useSelector(selectSiteConfig) || {}
  const inventory = useSelector(selectProducts)

  // Fetch data on mount
  useEffect(() => {
    dispatch(fetchPublicConfig())
    dispatch(fetchProducts())
  }, [dispatch])

  // Helper to update site config via API
  const updateSiteConfig = async (data) => {
    try {
      await dispatch(adminUpdateSiteConfig(data)).unwrap()
      dispatch(fetchPublicConfig()) // Refresh config
      return true
    } catch (error) {
      console.error('Failed to update site config:', error)
      return false
    }
  }
  const [isLoading, setIsLoading] = useState(false)
  const [editingParallax, setEditingParallax] = useState(null)
  const [expandedCategory, setExpandedCategory] = useState(null)

  // Max cards per category
  const MAX_CARDS_PER_CATEGORY = 6

  // Card addition modal state
  const [showAddCardModal, setShowAddCardModal] = useState(false)
  const [addCardStep, setAddCardStep] = useState(1) // 1: Select Section, 2: Select Subcategory, 3: Select Image
  const [selectedSection, setSelectedSection] = useState(null) // 'women', 'kids', 'fashion'
  const [selectedSubcategory, setSelectedSubcategory] = useState(null)
  const [selectedImage, setSelectedImage] = useState('')
  const [customImagePath, setCustomImagePath] = useState('')
  const [targetCategoryIndex, setTargetCategoryIndex] = useState(null)

  // Parallax Categories State with cards - from database only, no defaults
  const [parallaxCategories, setParallaxCategories] = useState(
    (siteConfig && siteConfig.parallaxCategories) ? siteConfig.parallaxCategories : []
  )

  // Banner Images State
  const [bannerImages, setBannerImages] = useState(
    (siteConfig && siteConfig.bannerImages) ? siteConfig.bannerImages : []
  )
  const [editingBanner, setEditingBanner] = useState(null)

  // Carousel Settings State - from database only
  const [carouselSettings, setCarouselSettings] = useState(
    (siteConfig && siteConfig.carouselSettings) ? siteConfig.carouselSettings : {}
  )

  // Section Titles State - from database only
  const [sectionTitles, setSectionTitles] = useState(
    (siteConfig && siteConfig.sectionTitles) ? siteConfig.sectionTitles : {}
  )

  // Homepage Section Titles State - from database only
  const [homepageSectionTitles, setHomepageSectionTitles] = useState(() => {
    const config = siteConfig || {}
    return (config.homepageSectionTitles && typeof config.homepageSectionTitles === 'object') 
      ? config.homepageSectionTitles 
      : {}
  })

  // Trust Badges State - from database only
  const [trustBadges, setTrustBadges] = useState(
    (siteConfig && siteConfig.trustBadges) ? siteConfig.trustBadges : []
  )
  const [editingBadge, setEditingBadge] = useState(null)


  // Form data - from database only, no hardcoded defaults
  const [formData, setFormData] = useState(() => {
    const config = siteConfig || {}
    return {
      flashSaleText: config.flashSaleText || '',
      flashSaleColor: config.flashSaleColor || '',
      showFlashSale: config.showFlashSale !== undefined ? config.showFlashSale : false,
      contactPhone: config.contactPhone || '',
      contactEmail: config.contactEmail || '',
      contactAddress: config.contactAddress || '',
      aboutStory: config.aboutStory || '',
      limitedTimeOfferTitle: config.limitedTimeOffer?.title || '',
      limitedTimeOfferSubtitle: config.limitedTimeOffer?.subtitle || '',
      limitedTimeOfferDescription: config.limitedTimeOffer?.description || '',
      limitedTimeOfferImage: config.limitedTimeOffer?.image || '',
      limitedTimeOfferText: config.limitedTimeOffer?.offerText || '',
      limitedTimeOfferEnabled: config.limitedTimeOffer?.enabled || false,
      // Admin Credentials
      admin: config.admin || '',
      password: config.password || '',
      // Delivery Settings
      freeShippingThreshold: config.deliverySettings?.freeShippingThreshold || '',
      standardDeliveryDays: config.deliverySettings?.standardDeliveryDays || '',
      codAvailable: config.deliverySettings?.codAvailable || false,
      // Location Settings
      mapEmbedUrl: config.contactPageContent?.mapSection?.embedUrl || '',
      mapDirectionsUrl: config.contactPageContent?.mapSection?.directionsUrl || '',
      mapTitle: config.contactPageContent?.mapSection?.title || '',
      mapSubtitle: config.contactPageContent?.mapSection?.subtitle || '',
      mapDescription: config.contactPageContent?.mapSection?.description || ''
    }
  })

  // Sync all local state when siteConfig changes from database
  useEffect(() => {
    if (!siteConfig) return

    // Update form data
    setFormData({
      flashSaleText: siteConfig.flashSaleText || '',
      flashSaleColor: siteConfig.flashSaleColor || '',
      showFlashSale: siteConfig.showFlashSale !== undefined ? siteConfig.showFlashSale : false,
      contactPhone: siteConfig.contactPhone || '',
      contactEmail: siteConfig.contactEmail || '',
      contactAddress: siteConfig.contactAddress || '',
      aboutStory: siteConfig.aboutStory || '',
      limitedTimeOfferTitle: siteConfig.limitedTimeOffer?.title || '',
      limitedTimeOfferSubtitle: siteConfig.limitedTimeOffer?.subtitle || '',
      limitedTimeOfferDescription: siteConfig.limitedTimeOffer?.description || '',
      limitedTimeOfferImage: siteConfig.limitedTimeOffer?.image || '',
      limitedTimeOfferText: siteConfig.limitedTimeOffer?.offerText || '',
      limitedTimeOfferEnabled: siteConfig.limitedTimeOffer?.enabled || false,
      admin: siteConfig.admin || '',
      password: siteConfig.password || '',
      freeShippingThreshold: siteConfig.deliverySettings?.freeShippingThreshold || '',
      standardDeliveryDays: siteConfig.deliverySettings?.standardDeliveryDays || '',
      codAvailable: siteConfig.deliverySettings?.codAvailable || false,
      mapEmbedUrl: siteConfig.contactPageContent?.mapSection?.embedUrl || '',
      mapDirectionsUrl: siteConfig.contactPageContent?.mapSection?.directionsUrl || '',
      mapTitle: siteConfig.contactPageContent?.mapSection?.title || '',
      mapSubtitle: siteConfig.contactPageContent?.mapSection?.subtitle || '',
      mapDescription: siteConfig.contactPageContent?.mapSection?.description || ''
    })

    // Update other states from database
    setParallaxCategories(siteConfig.parallaxCategories || [])
    setBannerImages(siteConfig.bannerImages || [])
    setCarouselSettings(siteConfig.carouselSettings || {})
    setSectionTitles(siteConfig.sectionTitles || {})
    setHomepageSectionTitles(
      (siteConfig.homepageSectionTitles && typeof siteConfig.homepageSectionTitles === 'object')
        ? siteConfig.homepageSectionTitles
        : {}
    )
    setTrustBadges(siteConfig.trustBadges || [])
  }, [siteConfig])

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target

    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  // Handle parallax category updates
  const handleParallaxChange = (index, field, value) => {
    setParallaxCategories(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const toggleParallaxEnabled = (index) => {
    setParallaxCategories(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], enabled: !updated[index].enabled }
      return updated
    })
  }

  // Update card subcategory (keeps options in sync with available subcategories)
  const handleCardSubcategoryChange = (catIndex, cardIndex, subcatId) => {
    const options = subcategoryOptions[parallaxCategories[catIndex]?.id] || []
    const subcat = options.find(opt => opt.id === subcatId)
    if (!subcat) return
    setParallaxCategories(prev => {
      const updated = [...prev]
      const cards = [...updated[catIndex].cards]
      cards[cardIndex] = {
        ...cards[cardIndex],
        id: subcat.id,
        label: subcat.name,
        image: cards[cardIndex].image || subcat.image,
        enabled: true
      }
      updated[catIndex] = { ...updated[catIndex], cards }
      return updated
    })
  }

  // Handle card changes within a category
  const handleCardChange = (catIndex, cardIndex, field, value) => {
    setParallaxCategories(prev => {
      const updated = [...prev]
      const updatedCards = [...updated[catIndex].cards]
      updatedCards[cardIndex] = { ...updatedCards[cardIndex], [field]: value }
      updated[catIndex] = { ...updated[catIndex], cards: updatedCards }
      return updated
    })
  }

  // Toggle card enabled/disabled
  const toggleCardEnabled = (catIndex, cardIndex) => {
    setParallaxCategories(prev => {
      const updated = [...prev]
      const updatedCards = [...updated[catIndex].cards]
      updatedCards[cardIndex] = { ...updatedCards[cardIndex], enabled: !updatedCards[cardIndex].enabled }
      updated[catIndex] = { ...updated[catIndex], cards: updatedCards }
      return updated
    })
  }

  // Open card addition modal
  const openAddCardModal = (catIndex) => {
    const category = parallaxCategories[catIndex]
    if ((category.cards || []).length >= MAX_CARDS_PER_CATEGORY) {
      toast.error(`Maximum ${MAX_CARDS_PER_CATEGORY} cards allowed per category`)
      return
    }
    // Auto-select section based on category
    const sectionMap = { women: 'women', kids: 'kids', fashion: 'fashion' }
    setSelectedSection(sectionMap[category.id] || null)
    setSelectedSubcategory(null)
    setSelectedImage('')
    setCustomImagePath('')
    setAddCardStep(sectionMap[category.id] ? 2 : 1) // Skip to step 2 if section auto-detected
    setTargetCategoryIndex(catIndex)
    setShowAddCardModal(true)
  }

  // Close card modal and reset state
  const closeAddCardModal = () => {
    setShowAddCardModal(false)
    setAddCardStep(1)
    setSelectedSection(null)
    setSelectedSubcategory(null)
    setSelectedImage('')
    setCustomImagePath('')
    setTargetCategoryIndex(null)
  }

  // Handle section selection
  const handleSectionSelect = (section) => {
    setSelectedSection(section)
    setSelectedSubcategory(null)
    setSelectedImage('')
    setAddCardStep(2)
  }

  // Handle subcategory selection
  const handleSubcategorySelect = (subcategory) => {
    setSelectedSubcategory(subcategory)
    setSelectedImage(subcategory.image || '')
    setAddCardStep(3)
  }

  // Handle image selection
  const handleImageSelect = (imagePath) => {
    setSelectedImage(imagePath)
    setCustomImagePath('')
  }

  // Confirm and add the card
  const confirmAddCard = () => {
    if (!selectedSubcategory) {
      toast.error('Please select a subcategory')
      return
    }
    const finalImage = customImagePath || selectedImage
    if (!finalImage) {
      toast.error('Please select or enter an image path')
      return
    }

    const newCard = {
      id: selectedSubcategory.id,
      label: selectedSubcategory.name,
      image: finalImage,
      enabled: true
    }

    setParallaxCategories(prev => {
      const updated = [...prev]
      // Check if card with same id already exists
      const existingCards = updated[targetCategoryIndex].cards || []
      const cardExists = existingCards.some(c => c.id === newCard.id)
      if (cardExists) {
        toast.error(`${newCard.label} card already exists in this category`)
        return prev
      }
      updated[targetCategoryIndex] = {
        ...updated[targetCategoryIndex],
        cards: [...existingCards, newCard]
      }
      return updated
    })

    toast.success(`${selectedSubcategory.name} card added successfully!`)
    closeAddCardModal()
  }

  // Generate sample image paths for subcategory
  const getSampleImages = (subcategory) => {
    if (!subcategory) return []
    const baseFolder = `/images/${subcategory.id}/`
    return [1, 2, 3, 4, 5].map(num => `${baseFolder}${num}.jpeg`)
  }

  // Delete card from category
  const deleteCard = (catIndex, cardIndex) => {
    setParallaxCategories(prev => {
      const updated = [...prev]
      const updatedCards = updated[catIndex].cards.filter((_, i) => i !== cardIndex)
      updated[catIndex] = { ...updated[catIndex], cards: updatedCards }
      return updated
    })
    toast.success('Card removed')
  }

  // Handle carousel settings changes
  const handleCarouselChange = (field, value) => {
    setCarouselSettings(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // Handle section titles changes
  // const handleSectionTitleChange = (section, field, value) => {
  //   setSectionTitles(prev => {
  //     const current = prev || {}
  //     return {
  //       ...current,
  //       [section]: { ...(current[section] || {}), [field]: value }
  //     }
  //   })
  // }

  // Handle homepage section titles changes (topSelling, featured, whyChooseUs)
  const handleHomepageSectionTitleChange = (section, field, value) => {
    setHomepageSectionTitles(prev => {
      const current = prev || {}
      return {
        ...current,
        [section]: { ...(current[section] || {}), [field]: value }
      }
    })
  }

  // Handle trust badge changes
  const handleTrustBadgeChange = (index, field, value) => {
    setTrustBadges(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  const toggleTrustBadge = (index) => {
    setTrustBadges(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], enabled: !updated[index].enabled }
      return updated
    })
  }

  // Handle banner changes
  const handleBannerChange = (index, field, value) => {
    setBannerImages(prev => {
      const updated = [...prev]
      updated[index] = { ...updated[index], [field]: value }
      return updated
    })
  }

  // Add new banner
  const addBanner = () => {
    const newBanner = {
      id: Date.now(),
      video: '/Panel%20videos/1.mp4',
      label: 'New Collection',
      title: 'New Banner',
      subtitle: 'Add your subtitle here',
      buttonText: 'Shop Now',
      link: '/shop'
    }
    setBannerImages(prev => [...prev, newBanner])
    setEditingBanner(bannerImages.length)
  }

  // Delete banner
  const deleteBanner = (index) => {
    if (bannerImages.length <= 1) {
      toast.error('At least one banner is required')
      return
    }
    setBannerImages(prev => prev.filter((_, i) => i !== index))
    setEditingBanner(null)
    toast.success('Banner deleted')
  }

  const handleSave = async () => {
    setIsLoading(true)

    // --- Limited Time Offer Banner S3 logic ---
    // Upload base64 images to S3 on save
    let newImageUrl = formData.limitedTimeOfferImage
    const prevImage = siteConfig?.limitedTimeOffer?.image
    if (isBase64Image(formData.limitedTimeOfferImage)) {
      try {
        const file = await fetch(formData.limitedTimeOfferImage).then(r => r.blob())
        const { url } = await uploadImageToS3(new File([file], 'limited-time-offer.jpg', { type: file.type }), 'limited-time-offer')
        newImageUrl = url
        // Delete previous S3 image if exists
        if (prevImage && isS3Image(prevImage)) {
          await deleteImageFromS3(prevImage)
        }
      } catch (err) {
        toast.error('Failed to upload banner image to S3')
        setIsLoading(false)
        return
      }
    } else if (prevImage && isS3Image(prevImage) && newImageUrl !== prevImage) {
      // If S3 image replaced with different URL, delete old
      try {
        await deleteImageFromS3(prevImage)
      } catch (err) {
        console.warn('Failed to delete old image:', err)
      }
    }

    // --- Specialization (Parallax) Cards S3 logic ---
    // Upload base64 images to S3 on save
    const updatedParallaxCategories = await Promise.all(parallaxCategories.map(async (cat, catIdx) => {
      // Only keep max 4 cards
      let cards = (cat.cards || []).slice(0, 4)
      // Track old images for deletion
      const prevCards = (siteConfig?.parallaxCategories?.[catIdx]?.cards || [])
      // Map of old images by card id
      const prevImagesById = Object.fromEntries(prevCards.map(c => [c.id, c.image]))
      // New cards array with S3 logic
      const newCards = await Promise.all(cards.map(async (card) => {
        let newImage = card.image
        const prevCardImage = prevImagesById[card.id]
        // If base64, upload to S3
        if (isBase64Image(card.image)) {
          try {
            const file = await fetch(card.image).then(r => r.blob())
            const { url } = await uploadImageToS3(new File([file], `specialization-${cat.id}-${card.id}.jpg`, { type: file.type }), `specialization/${cat.id}`)
            newImage = url
            // Delete previous S3 image if exists
            if (prevCardImage && isS3Image(prevCardImage)) {
              await deleteImageFromS3(prevCardImage)
            }
          } catch (err) {
            toast.error(`Failed to upload specialization image for ${card.label}`)
          }
        } else if (prevCardImage && isS3Image(prevCardImage) && newImage !== prevCardImage) {
          // If S3 image replaced, delete old
          try {
            await deleteImageFromS3(prevCardImage)
          } catch (err) {
            console.warn('Failed to delete old card image:', err)
          }
        }
        return { ...card, image: newImage }
      }))
      return { ...cat, cards: newCards }
    }))

    // --- Banner Videos S3 cleanup logic ---
    // Delete old S3 videos when banner videos are changed
    const prevBannerImages = siteConfig?.bannerImages || []
    for (let i = 0; i < bannerImages.length; i++) {
      const newVideo = bannerImages[i]?.video
      const prevVideo = prevBannerImages[i]?.video

      // If video changed and old video was S3, delete it
      if (prevVideo && prevVideo !== newVideo && isS3Video(prevVideo)) {
        try {
          await deleteVideoFromS3(prevVideo)
          console.log('Deleted old banner video from S3:', prevVideo)
        } catch (err) {
          console.warn('Failed to delete old banner video:', err)
        }
      }
    }

    // Also handle deleted banners (if current list is shorter than previous)
    if (prevBannerImages.length > bannerImages.length) {
      for (let i = bannerImages.length; i < prevBannerImages.length; i++) {
        const deletedVideo = prevBannerImages[i]?.video
        if (deletedVideo && isS3Video(deletedVideo)) {
          try {
            await deleteVideoFromS3(deletedVideo)
            console.log('Deleted banner video from removed banner:', deletedVideo)
          } catch (err) {
            console.warn('Failed to delete video from removed banner:', err)
          }
        }
      }
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000))

    // If admin credentials are being updated, use the dedicated API route (unchanged)
    if (formData.admin && formData.password && siteConfig._id) {
      try {
        const response = await fetch(
          `http://localhost:3000/admin/site-config/${siteConfig._id}/admin-credentials`,
          {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              admin: formData.admin,
              password: formData.password
            })
          }
        )
        if (response.ok) {
          toast.success('Admin credentials updated successfully!')
        } else {
          toast.error('Failed to update admin credentials')
        }
      } catch (error) {
        console.error('Error updating admin credentials:', error)
        toast.error('Error updating admin credentials')
      }
    }

    updateSiteConfig({
      ...formData,
      limitedTimeOffer: {
        ...(siteConfig?.limitedTimeOffer || {}),
        title: formData.limitedTimeOfferTitle,
        subtitle: formData.limitedTimeOfferSubtitle,
        description: formData.limitedTimeOfferDescription,
        image: newImageUrl,
        offerText: formData.limitedTimeOfferText,
        enabled: formData.limitedTimeOfferEnabled !== undefined ? formData.limitedTimeOfferEnabled : true
      },
      deliverySettings: {
        freeShippingThreshold: parseInt(formData.freeShippingThreshold) || 2999,
        standardDeliveryDays: formData.standardDeliveryDays,
        codAvailable: formData.codAvailable
      },
      parallaxCategories: updatedParallaxCategories,
      carouselSettings: carouselSettings,
      bannerImages: bannerImages,
      sectionTitles: sectionTitles,
      homepageSectionTitles: homepageSectionTitles,
      trustBadges: trustBadges,
      contactPageContent: {
        ...(siteConfig?.contactPageContent || {}),
        mapSection: {
          ...(siteConfig?.contactPageContent?.mapSection || {}),
          title: formData.mapTitle,
          subtitle: formData.mapSubtitle,
          description: formData.mapDescription,
          embedUrl: formData.mapEmbedUrl,
          directionsUrl: formData.mapDirectionsUrl,
          directionsButtonText: 'Get Directions'
        }
      }
    })

    setIsLoading(false)
    setEditingParallax(null)
    setEditingBanner(null)
    toast.success('Site content updated successfully!')
  }

  const handleReset = async () => {
    // Delete S3 image if exists for Limited Time Offer Banner
    const prevImage = siteConfig?.limitedTimeOffer?.image
    if (prevImage && isS3Image(prevImage)) {
      try {
        await deleteImageFromS3(prevImage)
      } catch (err) {}
    }

    // --- Specialization (Parallax) Cards S3 cleanup ---
    // Delete all S3 images for cards in current siteConfig (before reset)
    if (Array.isArray(siteConfig?.parallaxCategories)) {
      for (const cat of siteConfig.parallaxCategories) {
        if (Array.isArray(cat.cards)) {
          for (const card of cat.cards) {
            if (card.image && isS3Image(card.image)) {
              try {
                await deleteImageFromS3(card.image)
              } catch (err) {}
            }
          }
        }
      }
    }

    // --- Banner Videos S3 cleanup ---
    // Delete all S3 videos for banners in current state (before reset)
    if (Array.isArray(bannerImages)) {
      for (const banner of bannerImages) {
        if (banner.video && isS3Video(banner.video)) {
          try {
            await deleteVideoFromS3(banner.video)
            console.log('Deleted banner video from S3 on reset:', banner.video)
          } catch (err) {
            console.warn('Failed to delete banner video on reset:', err)
          }
        }
      }
    }

    setFormData({
      flashSaleText: siteConfig?.flashSaleText || '',
      flashSaleColor: siteConfig?.flashSaleColor || '#e91e8c',
      contactPhone: siteConfig?.contactPhone || '',
      contactEmail: siteConfig?.contactEmail || '',
      contactAddress: siteConfig?.contactAddress || '',
      aboutStory: siteConfig?.aboutStory || '',
    limitedTimeOfferTitle: siteConfig?.limitedTimeOffer?.title || 'Limited Time Offer',
    limitedTimeOfferSubtitle: siteConfig?.limitedTimeOffer?.subtitle || 'Exclusive Designer Collection',
    limitedTimeOfferDescription: siteConfig?.limitedTimeOffer?.description || 'Get flat 30% off on our premium designer lehengas.',
    limitedTimeOfferImage: siteConfig?.limitedTimeOffer?.image || '/images/ad-banner-bg.jpg',
    limitedTimeOfferText: siteConfig?.limitedTimeOffer?.offerText || 'Limited stock available!',
    // Delivery Settings
    freeShippingThreshold: siteConfig?.deliverySettings?.freeShippingThreshold || 2999,
      standardDeliveryDays: siteConfig?.deliverySettings?.standardDeliveryDays || '5-7',
      codAvailable: siteConfig?.deliverySettings?.codAvailable ?? true,
    mapEmbedUrl: siteConfig?.contactPageContent?.mapSection?.embedUrl || 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3772.253308426!2d72.82601871490263!3d18.985456087128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3be7ce6e3c8e3bfd%3A0x7b0a7b0b8d8a0e0!2sCrawford%20Market!5e0!3m2!1sen!2sin!4v1629287389751!5m2!1sen!2sin',
    mapDirectionsUrl: siteConfig?.contactPageContent?.mapSection?.directionsUrl || 'https://maps.google.com/?q=Crawford+Market+Mumbai',
    mapTitle: siteConfig?.contactPageContent?.mapSection?.title || 'Find Us Here',
    mapSubtitle: siteConfig?.contactPageContent?.mapSection?.subtitle || 'Visit our boutique for a personalized shopping experience',
    mapDescription: siteConfig?.contactPageContent?.mapSection?.description || 'Experience our collection in person. Our store offers personalized styling assistance, custom measurements, and expert fashion advice from our dedicated team.'
  })
    setParallaxCategories(siteConfig?.parallaxCategories || parallaxCategories)
    setCarouselSettings(siteConfig?.carouselSettings || carouselSettings)
    setBannerImages(siteConfig?.bannerImages || bannerImages)
    setSectionTitles(siteConfig?.sectionTitles || sectionTitles)
    setTrustBadges(siteConfig?.trustBadges || trustBadges)
    setEditingParallax(null)
    setEditingBanner(null)
    setEditingBadge(null)
    toast.success('Form reset to current values')
  }

  return (
    <div className="site-content-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h2>Site Content Management</h2>
          <p>Update website text and configurations</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleReset}>
            <FiRefreshCw />
            Reset
          </button>
          <button
            className={`btn btn-primary ${isLoading ? 'loading' : ''}`}
            onClick={handleSave}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="loader"></span>
                Saving...
              </>
            ) : (
              <>
                <FiSave />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>

      <div className="content-sections">
        {/* Flash Sale Section */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="card-header">
            <FiMessageSquare className="card-icon" />
            <div>
              <h3>Flash Sale Ticker</h3>
              <p>This text appears in the scrolling banner on the homepage</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="showFlashSale"
                  checked={formData.showFlashSale}
                  onChange={handleInputChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Enable Flash Sale Ticker</span>
              </label>
              <small className="field-hint">Toggle to show/hide the scrolling ticker on the homepage</small>
            </div>
            <textarea
              name="flashSaleText"
              value={formData.flashSaleText || ''}
              onChange={handleInputChange}
              className="input-field"
              rows="3"
              placeholder="Enter flash sale message..."
              maxLength={100}
            />
            <div className="preview-box">
              <span className="preview-label">Preview:</span>
              <div className="ticker-preview">
                <span>{formData.flashSaleText || 'Enter your flash sale message...'}</span>
              </div>
            </div>
            <small className="char-count-hint" style={{ display: 'block', marginTop: '8px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              {(formData.flashSaleText || '').length}/100 characters
            </small>
            <div className="form-group" style={{ marginTop: 'var(--spacing-md)' }}>
              <label>Ticker Text Color</label>
              <div style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
                <input
                  type="color"
                  value={formData.flashSaleColor || '#e91e8c'}
                  onChange={(e) => handleInputChange({ target: { name: 'flashSaleColor', value: e.target.value } })}
                  style={{ width: '60px', height: '40px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--glass-border)', cursor: 'pointer' }}
                />
                <input
                  type="text"
                  name="flashSaleColor"
                  value={formData.flashSaleColor || '#e91e8c'}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="#e91e8c"
                  style={{ flex: 1, maxWidth: '200px' }}
                />
              </div>
              <small className="field-hint">Choose the color for the flash sale ticker text</small>
            </div>
            <div className="preview-box" style={{ marginTop: 'var(--spacing-md)' }}>
              <span className="preview-label">Color Preview:</span>
              <div className="ticker-preview" style={{ background: formData.flashSaleColor || '#e91e8c' }}>
                <span style={{ color: 'white' }}>{formData.flashSaleText || 'Enter your flash sale message...'}</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Contact Information */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="card-header">
            <FiPhone className="card-icon" />
            <div>
              <h3>Contact Information</h3>
              <p>Update store contact details shown on the website</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="text"
                  name="contactPhone"
                  value={formData.contactPhone}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="+91 98765 43210"
                />
              </div>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="contactEmail"
                  value={formData.contactEmail}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="support@thisaiboutique.com"
                />
              </div>
              <div className="form-group full-width">
                <label>Store Address</label>
                <textarea
                  name="contactAddress"
                  value={formData.contactAddress}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="2"
                  placeholder="Enter store address..."
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Admin Login Credentials */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <div className="card-header">
            <FiShield className="card-icon" />
            <div>
              <h3>Admin Login Credentials</h3>
              <p>Set admin username and password (stored in database, not hashed)</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label>Admin Username</label>
                <input
                  type="text"
                  name="admin"
                  value={formData.admin || ''}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="admin"
                />
                <small className="field-hint">Username for admin login</small>
              </div>
              <div className="form-group">
                <label>Admin Password</label>
                <input
                  type="text"
                  name="password"
                  value={formData.password || ''}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Enter password"
                />
                <small className="field-hint">Password for admin login (stored as plain text)</small>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Delivery Settings */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="card-header">
            <FiTruck className="card-icon" />
            <div>
              <h3>Delivery Settings</h3>
              <p>Configure shipping and delivery options</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label>Free Shipping Threshold (₹)</label>
                <input
                  type="number"
                  name="freeShippingThreshold"
                  value={formData.freeShippingThreshold || ''}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="2999"
                />
                <small className="field-hint">Orders above this amount get free shipping</small>
              </div>
              <div className="form-group">
                <label>Standard Delivery Days</label>
                <input
                  type="text"
                  name="standardDeliveryDays"
                  value={formData.standardDeliveryDays}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="5-7"
                />
                <small className="field-hint">Estimated delivery time (e.g., 5-7 days)</small>
              </div>
              <div className="form-group checkbox-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    name="codAvailable"
                    checked={formData.codAvailable}
                    onChange={handleInputChange}
                  />
                  <span>Cash on Delivery Available</span>
                </label>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Section Titles */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="card-header">
            <FiFileText className="card-icon" />
            <div>
              <h3>Homepage Section Titles</h3>
              <p>Customize titles and subtitles for homepage sections</p>
            </div>
          </div>
          <div className="card-content">
            <div className="section-titles-list">
              {/* Top Selling Section */}
              <div className="section-title-item">
                <h4>Top Selling Section</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={homepageSectionTitles?.topSelling?.title || ''}
                      onChange={(e) => handleHomepageSectionTitleChange('topSelling', 'title', e.target.value)}
                      className="input-field"
                      placeholder="Top Selling"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtitle</label>
                    <input
                      type="text"
                      value={homepageSectionTitles?.topSelling?.subtitle || ''}
                      onChange={(e) => handleHomepageSectionTitleChange('topSelling', 'subtitle', e.target.value)}
                      className="input-field"
                      placeholder="Our most loved pieces by customers"
                    />
                  </div>
                </div>
              </div>

              {/* Featured Section */}
              <div className="section-title-item">
                <h4>Featured Collection Section</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={homepageSectionTitles?.featured?.title || ''}
                      onChange={(e) => handleHomepageSectionTitleChange('featured', 'title', e.target.value)}
                      className="input-field"
                      placeholder="Featured Collection"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtitle</label>
                    <input
                      type="text"
                      value={homepageSectionTitles?.featured?.subtitle || ''}
                      onChange={(e) => handleHomepageSectionTitleChange('featured', 'subtitle', e.target.value)}
                      className="input-field"
                      placeholder="Handpicked premium pieces for you"
                    />
                  </div>
                </div>
              </div>

              {/* Why Choose Us Section */}
              <div className="section-title-item">
                <h4>Why Choose Us Section</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={homepageSectionTitles?.whyChooseUs?.title || ''}
                      onChange={(e) => handleHomepageSectionTitleChange('whyChooseUs', 'title', e.target.value)}
                      className="input-field"
                      placeholder="Why Choose Us"
                    />
                  </div>
                  <div className="form-group">
                    <label>Subtitle (optional)</label>
                    <input
                      type="text"
                      value={homepageSectionTitles?.whyChooseUs?.subtitle || ''}
                      onChange={(e) => handleHomepageSectionTitleChange('whyChooseUs', 'subtitle', e.target.value)}
                      className="input-field"
                      placeholder="Optional subtitle..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Limited Time Offer Banner */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="card-header">
            <FiImage className="card-icon" />
            <div>
              <h3>Limited Time Offer Banner</h3>
              <p>Customize the promotional banner on the homepage</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-group" style={{ marginBottom: 'var(--spacing-md)' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  name="limitedTimeOfferEnabled"
                  checked={formData.limitedTimeOfferEnabled}
                  onChange={handleInputChange}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>Enable Limited Time Offer Banner</span>
              </label>
              <small className="field-hint">Toggle to show/hide this banner on the homepage</small>
            </div>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Background Image URL</label>
                <ImageUpload
                  value={formData.limitedTimeOfferImage}
                  onChange={(value) => handleInputChange({ target: { name: 'limitedTimeOfferImage', value } })}
                  placeholder="/images/ad-banner-bg.jpg"
                />
                <small className="field-hint">Enter the image path, URL, or upload from device/camera</small>
              </div>
              <div className="form-group">
                <label>Title (Label)</label>
                <input
                  type="text"
                  name="limitedTimeOfferTitle"
                  value={formData.limitedTimeOfferTitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Limited Time Offer"
                />
                <small className="field-hint">Small label text at the top</small>
              </div>
              <div className="form-group">
                <label>Subtitle (Main Heading)</label>
                <input
                  type="text"
                  name="limitedTimeOfferSubtitle"
                  value={formData.limitedTimeOfferSubtitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Exclusive Designer Collection"
                />
                <small className="field-hint">Large heading text</small>
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="limitedTimeOfferDescription"
                  value={formData.limitedTimeOfferDescription}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="Get flat 30% off on our premium designer lehengas."
                />
                <small className="field-hint">Main description text</small>
              </div>
              <div className="form-group full-width">
                <label>Offer Text</label>
                <input
                  type="text"
                  name="limitedTimeOfferText"
                  value={formData.limitedTimeOfferText}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Limited stock available!"
                />
                <small className="field-hint">Additional offer text or call-to-action message</small>
              </div>
            </div>
            <div className="preview-section" style={{ marginTop: '24px', padding: '16px', background: 'var(--glass-bg)', borderRadius: '8px', border: '1px solid var(--glass-border)' }}>
              <h4 style={{ marginBottom: '12px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>Preview:</h4>
              <div style={{ 
                backgroundImage: `url(${formData.limitedTimeOfferImage})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                borderRadius: '8px',
                padding: '24px',
                minHeight: '200px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                textAlign: 'center',
                color: 'white',
                position: 'relative',
                overflow: 'hidden'
              }}>
                <div style={{ 
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: 'rgba(0, 0, 0, 0.4)',
                  zIndex: 1
                }} />
                <div style={{ position: 'relative', zIndex: 2 }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: '600', letterSpacing: '1px', textTransform: 'uppercase', opacity: 0.9 }}>
                    {formData.limitedTimeOfferTitle || 'Limited Time Offer'}
                  </span>
                  <h2 style={{ fontSize: '1.8rem', fontWeight: '700', margin: '8px 0' }}>
                    {formData.limitedTimeOfferSubtitle || 'Exclusive Designer Collection'}
                  </h2>
                  <p style={{ fontSize: '1rem', margin: '8px 0', opacity: 0.95 }}>
                    {formData.limitedTimeOfferDescription || 'Get flat 30% off on our premium designer lehengas.'}
                  </p>
                  {formData.limitedTimeOfferText && (
                    <p style={{ fontSize: '0.9rem', marginTop: '8px', fontWeight: '600', opacity: 0.9 }}>
                      {formData.limitedTimeOfferText}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Trust Badges / Store Features */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <FiShield className="card-icon" />
            <div>
              <h3>Trust Badges & Store Features</h3>
              <p>Features displayed in "Why Choose Us" section on homepage</p>
            </div>
          </div>
          <div className="card-content">
            <div className="trust-badges-list">
              {trustBadges.map((badge, index) => (
                <div key={badge.id} className={`trust-badge-management-item ${!badge.enabled ? 'disabled' : ''}`}>
                  <div className="badge-item-header">
                    <div className="badge-item-preview">
                      <span className="badge-icon-preview">{badge.icon}</span>
                      <div className="badge-item-info">
                        <strong>{badge.title}</strong>
                        <span>{badge.description}</span>
                      </div>
                    </div>
                    <div className="badge-item-actions">
                      <button
                        className={`toggle-btn ${badge.enabled ? 'active' : ''}`}
                        onClick={() => toggleTrustBadge(index)}
                        title={badge.enabled ? 'Disable' : 'Enable'}
                      >
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => setEditingBadge(editingBadge === index ? null : index)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                    </div>
                  </div>

                  {editingBadge === index && (
                    <motion.div
                      className="badge-edit-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Icon (emoji)</label>
                          <input
                            type="text"
                            value={badge.icon}
                            onChange={(e) => handleTrustBadgeChange(index, 'icon', e.target.value)}
                            className="input-field"
                            placeholder="🚚"
                          />
                          <small className="field-hint">Use any emoji (e.g., 🚚, ↩️, 🔒, 💎)</small>
                        </div>
                        <div className="form-group">
                          <label>Title</label>
                          <input
                            type="text"
                            value={badge.title}
                            onChange={(e) => handleTrustBadgeChange(index, 'title', e.target.value)}
                            className="input-field"
                            placeholder="Free Shipping"
                          />
                        </div>
                        <div className="form-group full-width">
                          <label>Description</label>
                          <input
                            type="text"
                            value={badge.description}
                            onChange={(e) => handleTrustBadgeChange(index, 'description', e.target.value)}
                            className="input-field"
                            placeholder="On orders above ₹2999"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            <p className="info-text">
              These badges appear in the "Why Choose Us" section on the homepage. Toggle to enable/disable or click edit to customize.
            </p>
          </div>
        </motion.div>

        {/* Limited Time Offer */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <div className="card-header">
            <FiImage className="card-icon" />
            <div>
              <h3>Limited Time Offer Banner</h3>
              <p>Configure the promotional banner on the homepage</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group">
                <label>Offer Title</label>
                <input
                  type="text"
                  name="limitedTimeOfferTitle"
                  value={formData.limitedTimeOfferTitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Limited Time Offer"
                />
              </div>
              <div className="form-group">
                <label>Subtitle</label>
                <input
                  type="text"
                  name="limitedTimeOfferSubtitle"
                  value={formData.limitedTimeOfferSubtitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Exclusive Designer Collection"
                />
              </div>
              <div className="form-group full-width">
                <label>Description</label>
                <textarea
                  name="limitedTimeOfferDescription"
                  value={formData.limitedTimeOfferDescription}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="2"
                  placeholder="Enter offer description..."
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Parallax Categories Section */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <div className="card-header">
            <FiLayers className="card-icon" />
            <div>
              <h3>Parallax Category Sections</h3>
              <p>Configure the parallax slideshow with subcategory cards (max {MAX_CARDS_PER_CATEGORY} cards per category)</p>
            </div>
          </div>
          <div className="card-content">
            <div className="parallax-categories-list">
              {parallaxCategories.map((category, catIndex) => (
                <div key={category.id} className={`parallax-category-item ${!category.enabled ? 'disabled' : ''}`}>
                  <div className="parallax-item-header">
                    <div className="parallax-item-preview">
                      <div
                        className="parallax-color-indicator"
                        style={{ backgroundColor: category.color }}
                      />
                      <div className="parallax-item-info">
                        <strong>{category.name}</strong>
                        <span>{category.subtitle} • {(category.cards || []).filter(c => c.enabled && c.image).length} cards active</span>
                      </div>
                    </div>
                    <div className="parallax-item-actions">
                      <button
                        className={`toggle-btn ${category.enabled ? 'active' : ''}`}
                        onClick={() => toggleParallaxEnabled(catIndex)}
                        title={category.enabled ? 'Disable' : 'Enable'}
                      >
                      </button>
                      <button
                        className="edit-btn"
                        onClick={() => setEditingParallax(editingParallax === catIndex ? null : catIndex)}
                        title="Edit Settings"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className={`expand-btn ${expandedCategory === catIndex ? 'expanded' : ''}`}
                        onClick={() => setExpandedCategory(expandedCategory === catIndex ? null : catIndex)}
                        title="Manage Cards"
                      >
                        <FiGrid />
                        {expandedCategory === catIndex ? <FiChevronUp /> : <FiChevronDown />}
                      </button>
                    </div>
                  </div>

                  {/* Category Settings Edit Form */}
                  <AnimatePresence>
                    {editingParallax === catIndex && (
                      <motion.div
                        className="parallax-edit-form"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="form-grid">
                          <div className="form-group">
                            <label>Title</label>
                            <input
                              type="text"
                              value={category.name}
                              onChange={(e) => handleParallaxChange(catIndex, 'name', e.target.value)}
                              className="input-field"
                              placeholder="Collection Name"
                            />
                          </div>
                          <div className="form-group">
                            <label>Subtitle</label>
                            <input
                              type="text"
                              value={category.subtitle}
                              onChange={(e) => handleParallaxChange(catIndex, 'subtitle', e.target.value)}
                              className="input-field"
                              placeholder="Elegant & Timeless"
                            />
                          </div>
                          <div className="form-group full-width">
                            <label>Description</label>
                            <textarea
                              value={category.description}
                              onChange={(e) => handleParallaxChange(catIndex, 'description', e.target.value)}
                              className="input-field"
                              rows="2"
                              placeholder="Short description..."
                            />
                          </div>
                          <div className="form-group">
                            <label>Link URL</label>
                            <input
                              type="text"
                              value={category.link}
                              onChange={(e) => handleParallaxChange(catIndex, 'link', e.target.value)}
                              className="input-field"
                              placeholder="/women"
                            />
                          </div>
                          <div className="form-group">
                            <label>Theme Color</label>
                            <div className="color-input-wrapper">
                              <input
                                type="color"
                                value={category.color}
                                onChange={(e) => handleParallaxChange(catIndex, 'color', e.target.value)}
                                className="color-picker"
                              />
                              <input
                                type="text"
                                value={category.color}
                                onChange={(e) => handleParallaxChange(catIndex, 'color', e.target.value)}
                                className="input-field color-text"
                                placeholder="#e91e8c"
                              />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Cards Management Section */}
                  <AnimatePresence>
                    {expandedCategory === catIndex && (
                      <motion.div
                        className="cards-management-section"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <div className="cards-header">
                          <h4>
                            <FiGrid /> Subcategory Cards ({(category.cards || []).length}/{MAX_CARDS_PER_CATEGORY})
                          </h4>
                          <button
                            className="btn btn-sm btn-primary"
                            onClick={() => openAddCardModal(catIndex)}
                            disabled={(category.cards || []).length >= MAX_CARDS_PER_CATEGORY}
                          >
                            <FiPlus /> Add Card
                          </button>
                        </div>

                        <div className="cards-grid">
                          {(category.cards || []).map((card, cardIndex) => {
                            const subcatOptions = subcategoryOptions[category.id] || []
                            const categoryProducts = inventory.filter(p => p.category === card.id && p.showInStore !== false)
                            return (
                              <div
                                key={card.id || `${category.id}-${cardIndex}`}
                                className={`card-management-item ${!card.enabled ? 'disabled' : ''} ${!card.image ? 'no-image' : ''}`}
                              >
                                <div className="card-preview">
                                  {card.image ? (
                                    <img src={card.image} alt={card.label} className="card-thumb" />
                                  ) : (
                                    <div className="card-thumb-placeholder">
                                      <FiImage />
                                      <span>No Image</span>
                                    </div>
                                  )}
                                  <div className="card-preview-overlay">
                                    <span className="card-label-preview">{card.label}</span>
                                  </div>
                                </div>

                                <div className="card-edit-fields">
                                  <div className="form-group">
                                    <label>Subcategory</label>
                                    <select
                                      className="input-field"
                                      value={card.id}
                                      onChange={(e) => handleCardSubcategoryChange(catIndex, cardIndex, e.target.value)}
                                    >
                                      <option value="">Select subcategory</option>
                                      {subcatOptions.map(opt => (
                                        <option key={opt.id} value={opt.id}>{opt.name}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="form-group">
                                    <label>Image Path</label>
                                    <ImageUpload
                                      value={card.image}
                                      onChange={(value) => handleCardChange(catIndex, cardIndex, 'image', value)}
                                      placeholder="/images/category/1.jpeg"
                                    />
                                    {categoryProducts.length > 0 && (
                                      <div className="product-search-inline">
                                        <input
                                          list={`product-options-${category.id}-${cardIndex}`}
                                          className="input-field"
                                          placeholder="Search product to use its image"
                                          onChange={(e) => {
                                            const prod = categoryProducts.find(p => p.name.toLowerCase() === e.target.value.toLowerCase())
                                            if (prod?.image) {
                                              handleCardChange(catIndex, cardIndex, 'image', prod.image)
                                            }
                                          }}
                                        />
                                        <datalist id={`product-options-${category.id}-${cardIndex}`}>
                                          {categoryProducts.map(p => (
                                            <option key={p.id} value={p.name} />
                                          ))}
                                        </datalist>
                                      </div>
                                    )}
                                  </div>
                                </div>

                                <div className="card-item-actions">
                                  <button
                                    className={`toggle-btn small ${card.enabled ? 'active' : ''}`}
                                    onClick={() => toggleCardEnabled(catIndex, cardIndex)}
                                    title={card.enabled ? 'Disable' : 'Enable'}
                                    disabled={!card.image}
                                  >
                                  </button>
                                  <button
                                    className="delete-btn small"
                                    onClick={() => deleteCard(catIndex, cardIndex)}
                                    title="Delete Card"
                                  >
                                    <FiTrash2 />
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {(category.cards || []).length === 0 && (
                          <div className="no-cards-message">
                            <FiImage />
                            <p>No cards added yet. Click "Add Card" to create subcategory cards.</p>
                          </div>
                        )}

                        <p className="cards-info-text">
                          <strong>Important:</strong> Only subcategories with products in inventory will appear on the homepage. 
                          Cards without images or products will not be displayed. Maximum {MAX_CARDS_PER_CATEGORY} cards per category.
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
            <p className="info-text">
              Each category can have up to {MAX_CARDS_PER_CATEGORY} subcategory cards. 
              <strong> Only subcategories with products in inventory will be displayed on the homepage.</strong> 
              Cards are displayed in a responsive grid on the homepage.
            </p>
          </div>
        </motion.div>

        {/* About Us Story */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
        >
          <div className="card-header">
            <FiFileText className="card-icon" />
            <div>
              <h3>About Us Story</h3>
              <p>Update the brand story displayed on the About Us page</p>
            </div>
          </div>
          <div className="card-content">
            <textarea
              name="aboutStory"
              value={formData.aboutStory}
              onChange={handleInputChange}
              className="input-field"
              rows="8"
              placeholder="Enter your brand story..."
            />
            <div className="char-count">
              {formData.aboutStory.length} characters
            </div>
          </div>
        </motion.div>

        {/* About Page Specializations */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.57 }}
        >
          <div className="card-header">
            <FiLayers className="card-icon" />
            <div>
              <h3>About Page Specializations</h3>
              <p>Manage images and text for "What We Do Best" section</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-group">
              <label>Section Label</label>
              <input
                type="text"
                value={siteConfig?.aboutPageContent?.specializations?.label || 'What We Do Best'}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      specializations: {
                        ...(siteConfig?.aboutPageContent?.specializations || {}),
                        label: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                placeholder="Section label"
              />
            </div>
            <div className="form-group">
              <label>Section Title</label>
              <input
                type="text"
                value={siteConfig?.aboutPageContent?.specializations?.title || 'Our Specializations'}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      specializations: {
                        ...(siteConfig?.aboutPageContent?.specializations || {}),
                        title: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                placeholder="Section title"
              />
            </div>
            <div className="form-group">
              <label>Section Subtitle</label>
              <input
                type="text"
                value={siteConfig?.aboutPageContent?.specializations?.subtitle || 'Expertise honed over years of dedicated craftsmanship'}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      specializations: {
                        ...(siteConfig?.aboutPageContent?.specializations || {}),
                        subtitle: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                placeholder="Section subtitle"
              />
            </div>

            <div className="specializations-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--spacing-md)' }}>
                <h4 style={{ margin: 0, color: 'var(--text-primary)' }}>Specialization Items (Max 4)</h4>
                <button
                  onClick={() => {
                    const items = [...(siteConfig?.aboutPageContent?.specializations?.items || [])]
                    if (items.length >= 4) {
                      toast.error('Maximum 4 specializations allowed')
                      return
                    }
                    items.push({ title: '', description: '', image: '', count: '' })
                    const updated = {
                      ...siteConfig,
                      aboutPageContent: {
                        ...(siteConfig?.aboutPageContent || {}),
                        specializations: {
                          ...(siteConfig?.aboutPageContent?.specializations || {}),
                          items
                        }
                      }
                    }
                    updateSiteConfig(updated)
                    toast.success('New specialization added')
                  }}
                  className="btn-primary"
                  disabled={(siteConfig?.aboutPageContent?.specializations?.items || []).length >= 4}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '8px', 
                    padding: '8px 16px',
                    opacity: (siteConfig?.aboutPageContent?.specializations?.items || []).length >= 4 ? 0.5 : 1,
                    cursor: (siteConfig?.aboutPageContent?.specializations?.items || []).length >= 4 ? 'not-allowed' : 'pointer'
                  }}
                >
                  <FiPlus /> Add Specialization
                </button>
              </div>
              {((siteConfig?.aboutPageContent?.specializations?.items || [
                { title: "Blouse Stitching", description: "Kurti Designs", image: "/images/blouses/5.jpeg", count: "2000+" },
                { title: "Kurti Designs", description: "Aari & Maggam", image: "/images/kurtis/10.jpeg", count: "1500+" },
                { title: "Aari & Maggam", description: "Bridal Wear", image: "/images/blouses/25.jpeg", count: "800+" },
                { title: "Bridal Wear", description: "Premium designs for your special day", image: "/images/lehengas/1.jpeg", count: "500+" }
              ]).filter(item => item != null)).map((item, index) => (
                <div key={index} className="specialization-item glass-card" style={{ padding: 'var(--spacing-lg)', marginBottom: 'var(--spacing-md)', position: 'relative' }}>
                  <button
                    onClick={() => {
                      const items = [...(siteConfig?.aboutPageContent?.specializations?.items || [])]
                      items.splice(index, 1)
                      const updated = {
                        ...siteConfig,
                        aboutPageContent: {
                          ...(siteConfig?.aboutPageContent || {}),
                          specializations: {
                            ...(siteConfig?.aboutPageContent?.specializations || {}),
                            items
                          }
                        }
                      }
                      updateSiteConfig(updated)
                      toast.success('Specialization removed')
                    }}
                    className="btn-secondary"
                    style={{ position: 'absolute', top: '8px', right: '16px', padding: '8px', borderRadius: '8px', color: 'var(--error)', width: '36px', height: '36px', minWidth: '36px', minHeight: '36px', flexShrink: 0 }}
                    title="Delete specialization"
                  >
                    <FiTrash2 />
                  </button>
                  <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-md)' }}>
                    <div className="form-group">
                      <label>Title</label>
                      <input
                        type="text"
                        value={item.title || ''}
                        onChange={(e) => {
                          const items = [...(siteConfig?.aboutPageContent?.specializations?.items || [])]
                          items[index] = { ...(items[index] || {}), title: e.target.value }
                          const updated = {
                            ...siteConfig,
                            aboutPageContent: {
                              ...(siteConfig?.aboutPageContent || {}),
                              specializations: {
                                ...(siteConfig?.aboutPageContent?.specializations || {}),
                                items
                              }
                            }
                          }
                          updateSiteConfig(updated)
                        }}
                        className="input-field"
                        placeholder="e.g. Blouse Stitching"
                      />
                    </div>
                    <div className="form-group">
                      <label>Description</label>
                      <input
                        type="text"
                        value={item.description || ''}
                        onChange={(e) => {
                          const items = [...(siteConfig?.aboutPageContent?.specializations?.items || [])]
                          items[index] = { ...(items[index] || {}), description: e.target.value }
                          const updated = {
                            ...siteConfig,
                            aboutPageContent: {
                              ...(siteConfig?.aboutPageContent || {}),
                              specializations: {
                                ...(siteConfig?.aboutPageContent?.specializations || {}),
                                items
                              }
                            }
                          }
                          updateSiteConfig(updated)
                        }}
                        className="input-field"
                        placeholder="e.g. Kurti Designs"
                      />
                    </div>
                    <div className="form-group">
                      <label>Image Path</label>
                      <ImageUpload
                        value={item.image || ''}
                        onChange={(value) => {
                          const items = [...(siteConfig?.aboutPageContent?.specializations?.items || [])]
                          items[index] = { ...(items[index] || {}), image: value }
                          const updated = {
                            ...siteConfig,
                            aboutPageContent: {
                              ...(siteConfig?.aboutPageContent || {}),
                              specializations: {
                                ...(siteConfig?.aboutPageContent?.specializations || {}),
                                items
                              }
                            }
                          }
                          updateSiteConfig(updated)
                        }}
                        placeholder="/images/blouses/5.jpeg"
                      />
                    </div>
                    <div className="form-group">
                      <label>Count</label>
                      <input
                        type="text"
                        value={item.count || ''}
                        onChange={(e) => {
                          const items = [...(siteConfig?.aboutPageContent?.specializations?.items || [])]
                          items[index] = { ...(items[index] || {}), count: e.target.value }
                          const updated = {
                            ...siteConfig,
                            aboutPageContent: {
                              ...(siteConfig?.aboutPageContent || {}),
                              specializations: {
                                ...(siteConfig?.aboutPageContent?.specializations || {}),
                                items
                              }
                            }
                          }
                          updateSiteConfig(updated)
                        }}
                        className="input-field"
                        placeholder="e.g. 2000+"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* About Page Mission Section */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58 }}
        >
          <div className="card-header">
            <FiHeart className="card-icon" />
            <div>
              <h3>About Page Mission Section</h3>
              <p>Edit your mission statement and inspirational quote</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-group">
              <label>Section Label (Optional)</label>
              <input
                type="text"
                value={siteConfig?.aboutPageContent?.mission?.label || ''}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      mission: {
                        ...(siteConfig?.aboutPageContent?.mission || {}),
                        label: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                placeholder="e.g. Our Purpose"
              />
            </div>
            <div className="form-group">
              <label>Mission Title</label>
              <input
                type="text"
                value={siteConfig?.aboutPageContent?.mission?.title || 'Our mission'}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      mission: {
                        ...(siteConfig?.aboutPageContent?.mission || {}),
                        title: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                placeholder="Our mission"
              />
            </div>
            <div className="form-group">
              <label>Mission Description</label>
              <textarea
                value={siteConfig?.aboutPageContent?.mission?.description || 'Make premium, well-fitted outfits accessible without compromising on craft or care.'}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      mission: {
                        ...(siteConfig?.aboutPageContent?.mission || {}),
                        description: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                rows="4"
                placeholder="Your mission statement..."
              />
            </div>
            <div className="form-group">
              <label>Inspirational Quote</label>
              <input
                type="text"
                value={siteConfig?.aboutPageContent?.mission?.quote || 'Style is personal; we\'re here to tailor it to you.'}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      mission: {
                        ...(siteConfig?.aboutPageContent?.mission || {}),
                        quote: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                placeholder="Your inspiring quote..."
              />
            </div>
            <div className="form-group">
              <label>Quote Author (Optional)</label>
              <input
                type="text"
                value={siteConfig?.aboutPageContent?.mission?.quoteAuthor || ''}
                onChange={(e) => {
                  const updated = {
                    ...siteConfig,
                    aboutPageContent: {
                      ...(siteConfig?.aboutPageContent || {}),
                      mission: {
                        ...(siteConfig?.aboutPageContent?.mission || {}),
                        quoteAuthor: e.target.value
                      }
                    }
                  }
                  updateSiteConfig(updated)
                }}
                className="input-field"
                placeholder="e.g. Founder Name"
              />
            </div>
          </div>
        </motion.div>

        {/* Carousel Settings */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-header">
            <FiSliders className="card-icon" />
            <div>
              <h3>Carousel Settings</h3>
              <p>Control auto-play and speed for all homepage carousels</p>
            </div>
          </div>
          <div className="card-content">
            {/* Hero Banner Settings */}
            <div className="carousel-settings-group">
              <h4>Hero Banner Carousel</h4>
              <div className="form-grid">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={carouselSettings.heroBannerAutoPlay}
                      onChange={(e) => handleCarouselChange('heroBannerAutoPlay', e.target.checked)}
                    />
                    <span>{carouselSettings.heroBannerAutoPlay ? <FiPlay /> : <FiPause />} Auto-Play Enabled</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Slide Duration (seconds)</label>
                  <input
                    type="number"
                    value={carouselSettings.heroBannerSpeed ? (carouselSettings.heroBannerSpeed / 1000) : 5}
                    onChange={(e) => handleCarouselChange('heroBannerSpeed', parseInt(e.target.value) * 1000 || 5000)}
                    className="input-field"
                    min="1"
                    max="20"
                  />
                  <small className="field-hint">Time each banner stays visible</small>
                </div>
              </div>
            </div>

            {/* Top Selling Settings */}
            <div className="carousel-settings-group">
              <h4>Top Selling Carousel</h4>
              <div className="form-grid">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={carouselSettings.topSellingAutoPlay}
                      onChange={(e) => handleCarouselChange('topSellingAutoPlay', e.target.checked)}
                    />
                    <span>{carouselSettings.topSellingAutoPlay ? <FiPlay /> : <FiPause />} Auto-Play Enabled</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Rotation Speed (seconds)</label>
                  <input
                    type="number"
                    value={carouselSettings.topSellingSpeed ? (carouselSettings.topSellingSpeed / 1000) : 3}
                    onChange={(e) => handleCarouselChange('topSellingSpeed', parseInt(e.target.value) * 1000 || 3000)}
                    className="input-field"
                    min="1"
                    max="20"
                    step="0.5"
                  />
                </div>
                <div className="form-group">
                  <label>Max Items to Show</label>
                  <input
                    type="number"
                    value={carouselSettings.topSellingItemsToShow || 8}
                    onChange={(e) => handleCarouselChange('topSellingItemsToShow', parseInt(e.target.value) || 8)}
                    className="input-field"
                    min="3"
                    max="20"
                  />
                  <small className="field-hint">Products marked as "Top Selling" in inventory</small>
                </div>
              </div>
            </div>

            {/* Featured Collection Settings */}
            <div className="carousel-settings-group">
              <h4>Featured Collection Carousel</h4>
              <div className="form-grid">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={carouselSettings.featuredAutoPlay}
                      onChange={(e) => handleCarouselChange('featuredAutoPlay', e.target.checked)}
                    />
                    <span>{carouselSettings.featuredAutoPlay ? <FiPlay /> : <FiPause />} Auto-Play Enabled</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Rotation Speed (seconds)</label>
                  <input
                    type="number"
                    value={carouselSettings.featuredSpeed ? (carouselSettings.featuredSpeed / 1000) : 3.5}
                    onChange={(e) => handleCarouselChange('featuredSpeed', parseInt(e.target.value) * 1000 || 3500)}
                    className="input-field"
                    min="1"
                    max="20"
                    step="0.5"
                  />
                </div>
                <div className="form-group">
                  <label>Max Items to Show</label>
                  <input
                    type="number"
                    value={carouselSettings.featuredItemsToShow || 8}
                    onChange={(e) => handleCarouselChange('featuredItemsToShow', parseInt(e.target.value) || 8)}
                    className="input-field"
                    min="3"
                    max="20"
                  />
                  <small className="field-hint">Products marked as "Featured" in inventory</small>
                </div>
              </div>
            </div>

            {/* Parallax Section Settings */}
            <div className="carousel-settings-group">
              <h4>Parallax Category Section</h4>
              <div className="form-grid">
                <div className="form-group checkbox-group">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={carouselSettings.parallaxAutoPlay}
                      onChange={(e) => handleCarouselChange('parallaxAutoPlay', e.target.checked)}
                    />
                    <span>{carouselSettings.parallaxAutoPlay ? <FiPlay /> : <FiPause />} Auto-Play Enabled</span>
                  </label>
                </div>
                <div className="form-group">
                  <label>Rotation Speed (seconds)</label>
                  <input
                    type="number"
                    value={carouselSettings.parallaxSpeed ? (carouselSettings.parallaxSpeed / 1000) : 5}
                    onChange={(e) => handleCarouselChange('parallaxSpeed', parseInt(e.target.value) * 1000 || 5000)}
                    className="input-field"
                    min="2"
                    max="30"
                  />
                  <small className="field-hint">Time each category stays visible</small>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Banner Images Management */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
        >
          <div className="card-header">
            <FiImage className="card-icon" />
            <div>
              <h3>Banner Videos</h3>
              <p>Manage hero banner videos on the homepage</p>
            </div>
            <button className="btn btn-sm btn-primary" onClick={addBanner}>
              <FiPlus /> Add Banner
            </button>
          </div>
          <div className="card-content">
            {bannerImages.length === 0 && (
              <div className="info-message" style={{ 
                padding: 'var(--spacing-md)', 
                background: 'var(--glass-bg)', 
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--spacing-md)',
                border: '1px solid var(--glass-border)'
              }}>
                <p style={{ margin: 0, color: 'var(--text-muted)' }}>
                  No banners yet. Click "Add Banner" to create your first hero banner.
                </p>
              </div>
            )}
            {bannerImages.length > 0 && (
              <div className="info-message" style={{ 
                padding: 'var(--spacing-sm)', 
                background: 'rgba(233, 30, 140, 0.1)', 
                borderRadius: 'var(--radius-sm)',
                marginBottom: 'var(--spacing-md)',
                border: '1px solid rgba(233, 30, 140, 0.2)',
                fontSize: '0.85rem'
              }}>
                <strong>💡 Tip:</strong> Click the <FiEdit2 style={{ display: 'inline', margin: '0 4px' }} /> edit button to update banner content. 
                Make sure to click "Save Changes" at the top after editing.
              </div>
            )}
            <div className="banner-management-list">
              {bannerImages.map((banner, index) => (
                <div key={banner.id || index} className="banner-management-item">
                  <div className="banner-item-header">
                    <div className="banner-item-preview">
                      {banner.video ? (
                        <video src={banner.video} className="banner-thumb" muted playsInline />
                      ) : (
                        <div className="banner-thumb-placeholder">No video</div>
                      )}
                      <div className="banner-item-info">
                        <strong>{banner.title}</strong>
                        <span>{banner.subtitle}</span>
                      </div>
                    </div>
                    <div className="banner-item-actions">
                      <button
                        className="edit-btn"
                        onClick={() => setEditingBanner(editingBanner === index ? null : index)}
                        title="Edit"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        className="delete-btn"
                        onClick={() => deleteBanner(index)}
                        title="Delete"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </div>

                  {editingBanner === index && (
                    <motion.div
                      className="banner-edit-form"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <div className="form-grid">
                        <div className="form-group">
                          <label>Label</label>
                          <input
                            type="text"
                            value={banner.label || ''}
                            onChange={(e) => handleBannerChange(index, 'label', e.target.value)}
                            className="input-field"
                            placeholder="New Collection"
                          />
                        </div>
                        <div className="form-group">
                          <label>Title</label>
                          <input
                            type="text"
                            value={banner.title}
                            onChange={(e) => handleBannerChange(index, 'title', e.target.value)}
                            className="input-field"
                            placeholder="Banner Title"
                          />
                        </div>
                        <div className="form-group">
                          <label>Subtitle</label>
                          <input
                            type="text"
                            value={banner.subtitle}
                            onChange={(e) => handleBannerChange(index, 'subtitle', e.target.value)}
                            className="input-field"
                            placeholder="Banner Subtitle"
                          />
                        </div>
                        <div className="form-group">
                          <label>Video Path</label>
                          <VideoUpload
                            value={banner.video || ''}
                            onChange={(value) => handleBannerChange(index, 'video', value)}
                            placeholder="/Panel%20videos/1.mp4"
                          />
                          <small className="field-hint">Upload a video file or enter the path from /public/Panel videos/ folder (e.g., /Panel%20videos/1.mp4)</small>
                        </div>
                        <div className="form-group">
                          <label>Button Text</label>
                          <input
                            type="text"
                            value={banner.buttonText}
                            onChange={(e) => handleBannerChange(index, 'buttonText', e.target.value)}
                            className="input-field"
                            placeholder="Shop Now"
                          />
                        </div>
                        <div className="form-group">
                          <label>Link URL</label>
                          <input
                            type="text"
                            value={banner.link}
                            onChange={(e) => handleBannerChange(index, 'link', e.target.value)}
                            className="input-field"
                            placeholder="/women"
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              ))}
            </div>
            <p className="info-text">
              Click edit to modify banner content. Videos transition smoothly and automatically based on carousel settings above.
            </p>
          </div>
        </motion.div>

        {/* Location Settings */}
        <motion.div
          className="content-card glass-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="card-header">
            <FiMapPin className="card-icon" />
            <div>
              <h3>Store Location</h3>
              <p>Manage map location and directions shown on the Contact page</p>
            </div>
          </div>
          <div className="card-content">
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Map Title</label>
                <input
                  type="text"
                  name="mapTitle"
                  value={formData.mapTitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Find Us Here"
                />
              </div>
              <div className="form-group full-width">
                <label>Map Subtitle</label>
                <input
                  type="text"
                  name="mapSubtitle"
                  value={formData.mapSubtitle}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="Visit our boutique for a personalized shopping experience"
                />
              </div>
              <div className="form-group full-width">
                <label>Map Description</label>
                <textarea
                  name="mapDescription"
                  value={formData.mapDescription}
                  onChange={handleInputChange}
                  className="input-field"
                  rows="3"
                  placeholder="Experience our collection in person..."
                />
              </div>
              <div className="form-group full-width">
                <label>Google Maps Embed URL</label>
                <input
                  type="text"
                  name="mapEmbedUrl"
                  value={formData.mapEmbedUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://www.google.com/maps/embed?pb=..."
                />
                <small className="field-hint">
                  Get embed URL from Google Maps: Share → Embed a map → Copy iframe src URL
                </small>
              </div>
              <div className="form-group full-width">
                <label>Directions URL</label>
                <input
                  type="text"
                  name="mapDirectionsUrl"
                  value={formData.mapDirectionsUrl}
                  onChange={handleInputChange}
                  className="input-field"
                  placeholder="https://maps.google.com/?q=..."
                />
                <small className="field-hint">
                  Get directions URL from Google Maps: Share → Copy link
                </small>
              </div>
            </div>
            {formData.mapEmbedUrl && formData.mapEmbedUrl.startsWith('https://') && (
              <div className="map-preview">
                <h4>Map Preview:</h4>
                <div className="map-preview-container">
                  <iframe
                    src={formData.mapEmbedUrl}
                    width="100%"
                    height="300"
                    style={{ border: 0, borderRadius: 'var(--radius-md)' }}
                    allowFullScreen={true}
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
                    title="Google Maps Preview"
                  />
                </div>
              </div>
            )}
            {formData.mapEmbedUrl && !formData.mapEmbedUrl.startsWith('https://') && (
              <div className="map-preview">
                <div className="map-preview-error">
                  <p>⚠️ Invalid map URL. Please enter a valid Google Maps embed URL starting with "https://"</p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Add Card Modal */}
      <AnimatePresence>
        {showAddCardModal && (
          <motion.div
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeAddCardModal}
          >
            <motion.div
              className="add-card-modal"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <h3>
                  <FiPlus /> Add Subcategory Card
                </h3>
                <button className="modal-close-btn" onClick={closeAddCardModal}>
                  <FiX />
                </button>
              </div>

              {/* Step Indicator */}
              <div className="step-indicator">
                <div className={`step ${addCardStep >= 1 ? 'active' : ''} ${addCardStep > 1 ? 'completed' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Section</span>
                </div>
                <div className="step-connector" />
                <div className={`step ${addCardStep >= 2 ? 'active' : ''} ${addCardStep > 2 ? 'completed' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Subcategory</span>
                </div>
                <div className="step-connector" />
                <div className={`step ${addCardStep >= 3 ? 'active' : ''}`}>
                  <span className="step-number">3</span>
                  <span className="step-label">Image</span>
                </div>
              </div>

              <div className="modal-content">
                {/* Step 1: Select Section */}
                {addCardStep === 1 && (
                  <div className="step-content">
                    <h4>Select Section</h4>
                    <p>Choose which collection this card belongs to</p>
                    <div className="section-options">
                      <button
                        className={`section-option ${selectedSection === 'women' ? 'selected' : ''}`}
                        onClick={() => handleSectionSelect('women')}
                        style={{ '--section-color': '#e91e8c' }}
                      >
                        <span className="section-icon">👗</span>
                        <span className="section-name">Women</span>
                        <span className="section-count">{womenCategories.length} subcategories</span>
                      </button>
                      <button
                        className={`section-option ${selectedSection === 'kids' ? 'selected' : ''}`}
                        onClick={() => handleSectionSelect('kids')}
                        style={{ '--section-color': '#ff6b6b' }}
                      >
                        <span className="section-icon">👶</span>
                        <span className="section-name">Kids</span>
                        <span className="section-count">{kidsCategories.length} subcategories</span>
                      </button>
                      <button
                        className={`section-option ${selectedSection === 'fashion' ? 'selected' : ''}`}
                        onClick={() => handleSectionSelect('fashion')}
                        style={{ '--section-color': '#ffd93d' }}
                      >
                        <span className="section-icon">👜</span>
                        <span className="section-name">Fashion</span>
                        <span className="section-count">{fashionCategories.length} subcategories</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2: Select Subcategory */}
                {addCardStep === 2 && selectedSection && (
                  <div className="step-content">
                    <div className="step-header-row">
                      <button className="back-btn" onClick={() => setAddCardStep(1)}>
                        &larr; Back
                      </button>
                      <h4>Select Subcategory</h4>
                    </div>
                    <p>Choose a subcategory from {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)} collection</p>
                    <p className="info-text" style={{ marginBottom: '12px', fontSize: '0.85rem', color: '#666' }}>
                      <strong>Note:</strong> Only subcategories with products in inventory will be shown. Upload products first to add cards.
                    </p>
                    <div className="subcategory-grid">
                      {subcategoryOptions[selectedSection]?.map((subcat) => {
                        // Check if this subcategory is already added
                        const existingCards = parallaxCategories[targetCategoryIndex]?.cards || []
                        const isAlreadyAdded = existingCards.some(c => c.id === subcat.id)
                        // Check if products exist in inventory for this subcategory
                        const hasProducts = inventory.some(product => product.category === subcat.id)
                        const isDisabled = isAlreadyAdded || !hasProducts
                        
                        return (
                          <button
                            key={subcat.id}
                            className={`subcategory-option ${selectedSubcategory?.id === subcat.id ? 'selected' : ''} ${isDisabled ? 'disabled' : ''}`}
                            onClick={() => !isDisabled && handleSubcategorySelect(subcat)}
                            disabled={isDisabled}
                            title={!hasProducts ? 'No products in inventory for this category' : isAlreadyAdded ? 'Already added' : ''}
                          >
                            <span className="subcat-icon">{subcat.icon}</span>
                            <span className="subcat-name">{subcat.name}</span>
                            {isAlreadyAdded && <span className="already-added-badge">Added</span>}
                            {!hasProducts && !isAlreadyAdded && <span className="no-products-badge">No Products</span>}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Step 3: Select Image */}
                {addCardStep === 3 && selectedSubcategory && (
                  <div className="step-content">
                    <div className="step-header-row">
                      <button className="back-btn" onClick={() => setAddCardStep(2)}>
                        &larr; Back
                      </button>
                      <h4>Select Image for {selectedSubcategory.name}</h4>
                    </div>
                    <p>Choose an existing image or enter a custom path</p>

                    {/* Image Preview */}
                    <div className="selected-image-preview">
                      {(customImagePath || selectedImage) ? (
                        <img src={customImagePath || selectedImage} alt="Preview" />
                      ) : (
                        <div className="no-image-placeholder">
                          <FiImage />
                          <span>No image selected</span>
                        </div>
                      )}
                    </div>

                    {/* Default Image Option */}
                    <div className="image-option-group">
                      <label>Default Image (from category):</label>
                      <button
                        className={`image-option-btn ${selectedImage === selectedSubcategory.image && !customImagePath ? 'selected' : ''}`}
                        onClick={() => handleImageSelect(selectedSubcategory.image)}
                      >
                        <img src={selectedSubcategory.image} alt="Default" className="image-option-thumb" />
                        <span>{selectedSubcategory.image}</span>
                        {selectedImage === selectedSubcategory.image && !customImagePath && <FiCheck className="check-icon" />}
                      </button>
                    </div>

                    {/* Sample Images */}
                    <div className="image-option-group">
                      <label>Sample Images:</label>
                      <div className="sample-images-grid">
                        {getSampleImages(selectedSubcategory).map((imgPath, idx) => (
                          <button
                            key={idx}
                            className={`sample-image-btn ${selectedImage === imgPath && !customImagePath ? 'selected' : ''}`}
                            onClick={() => handleImageSelect(imgPath)}
                          >
                            <img src={imgPath} alt={`Sample ${idx + 1}`} onError={(e) => { e.target.style.display = 'none' }} />
                            {selectedImage === imgPath && !customImagePath && <FiCheck className="check-icon" />}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Image Path */}
                    <div className="image-option-group">
                      <label>Or Enter Custom Image Path / Upload:</label>
                      <ImageUpload
                        value={customImagePath}
                        onChange={(value) => {
                          setCustomImagePath(value)
                          if (value) setSelectedImage('')
                        }}
                        placeholder="/images/category/filename.jpeg"
                      />
                      <small className="field-hint">Enter the path relative to public folder or upload from device/camera</small>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={closeAddCardModal}>
                  Cancel
                </button>
                {addCardStep === 3 && (
                  <button
                    className="btn btn-primary"
                    onClick={confirmAddCard}
                    disabled={!selectedSubcategory || (!selectedImage && !customImagePath)}
                  >
                    <FiCheck /> Add Card
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default SiteContent
