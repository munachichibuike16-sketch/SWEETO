import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const translations = {
  en: {
    // Header & Nav
    home: "Home", saved: "Saved", profile: "Profile", me: "Me", cart: "Cart",
    my_orders: "Orders", settings: "Settings", member_since: "Member Since", security: "Security", wishlist: "Wishlist", hello: "Hello",
    search_placeholder: "Search premium store...", welcome: "Welcome", sign_in: "SIGN IN", account: "Account",
    recent_arrivals: "Recent Arrivals", new: "New", just_arrived: "Just arrived!", view_all_new: "View All New Goods",
    visit_us: "Visit Us", language: "Language", theme: "Theme", notifications: "Notifications", store_tab: "Store", chat_tab: "Chat", activity: "Activity",
    // Sidebar & Filters
    home_intelligence: "Home Intelligence", luxury_collection: "Luxury Collection", corporate_location: "Corporate Location",
    curated_wishlist: "Curated Wishlist", global_account: "Global Account", preference_node: "Preference Node",
    regional_language: "Regional Language", department_core: "Department Core", partner_brands: "Partner Brands",
    matrix_filter: "Matrix Filter", optimize_search: "Optimize Search", no_premium_partners: "No Premium Partners",
    units_available: "Units Available", shop_by: "Shop by", discover_gear: "Discover gear by specialized departments",
    // Hero & Banners
    featured_selection: "Featured Selection", explore_now: "Explore Now", exclusive_showcase: "Exclusive Showcase",
    starting_at: "Starting at", discount: "Discount", active_now: "Active Now", view_product: "View Product",
    claim_offer: "Claim Offer", video_commercial: "Video Commercial", premium_banner: "Premium Banner",
    exclusive_tech_deals: "Exclusive Tech Deals", discover_deals: "Discover Deals",
    // Products & Cart
    view_all: "View All", add_to_cart: "Add to Cart", out_of_stock: "Out of Stock", in_stock: "In Stock",
    your_cart: "Your Cart", checkout: "Checkout", total: "Total", empty_cart: "Your cart is empty",
    continue_shopping: "Continue Shopping", subtotal: "Subtotal", taxes_calculated: "Taxes calculated at checkout",
    remove: "Remove", color: "Color", size: "Size", quantity: "Quantity", description: "Description", features: "Features", reviews: "Reviews",
    default_product_desc: "Experience the pinnacle of technology and design with this high-performance device, engineered for the most demanding users.",
    premium_material_desc: "Our master craftsmen have engineered this product using only the finest premium materials. Every curve and component is meticulously tested to ensure it meets our rigorous standards of high-performance excellence and durability.",
    big_performance_sleek_design: "Big Performance Sleek Design", premium_collection: "Premium Collection", discover_latest_tech: "Discover the latest in high-end technology",
    premium_edition: "Premium Edition", sold: "Sold", discover_product: "Discover Product", buy_now: "Buy Now",
    feedback: "Feedback", global_intel: "Global Intel", community_rating: "Community Performance Rating",
    leave_review: "Leave your mark", share_experience: "Share your experience...", submit_experience: "Submit Experience",
    related: "Related", you_might_also_like: "You Might Also Like", curated_for_you: "Curated Selection",
    verified_authentic: "Verified Authentic Stock", login_now: "Login to Continue", products: "Products",
    premium_items: "Premium Items", select_gear: "Select your gear from the hub", local_handling: "Local Handling", gratis: "FREE",
    elite_offer: "Elite Offer", video_promo: "Video Promo", explore_all: "Explore All", view_cart: "View Cart", checkout_now: "Checkout Now",
    // Footer & Misc
    get_directions: "Directions", call_support: "Support", stay_connected: "Stay Connected",
    about_hub: "About Sweeto-Hub",
    about_desc: "SWEETO-HUB is your trusted premium electronics store in Abidjan. We bring the best of global technology directly to your doorstep.",
    explore_categories: "Explore Categories",
    location_schedule: "Location & Schedule",
    physical_store: "Physical Store",
    opening_hours: "Opening Hours",
    exclusive_daily_discounts: "Daily Flash Deals",
    subscribe_desc: "Join our elite circle for early access to premium drops and exclusive hub intel.",
    enter_email: "ENTER YOUR EMAIL", subscriber_join: "JOIN THE HUB", secure_spam_free: "SECURE & SPAM-FREE",
    privacy: "Privacy", terms: "Terms", security: "Security",
    welcome_hub: "Welcome to the Hub", check_inbox: "Check your inbox for exclusive deals",
    // Categories & Sort
    our_top_categories: "Our Top Categories",
    explore_curated: "Explore curated products by premium departments",
    categories: "Categories", all_products: "All Products", daily_deals: "Daily Deals", trending: "Trending", new_arrivals: "New Arrivals",
    sort_by: "Sort by:", name_az: "Name (A-Z)", price_low_high: "Price: Low to High", price_high_low: "Price: High to Low", latest_arrivals: "Latest Arrivals",
    back: "Back", discovery: "Discovery", deal_of_day: "Deal of the Day", featured_items: "Featured Items",
    search_results: "Search Results", found_matches: "Found premium matches", premium_selection: "Premium Selection of",
    discover_full_range: "Discover Our Full Range", recently_viewed: "Recently Viewed", tech_history: "Your Personal Tech History",
    featured: "Featured", shop_now: "Shop Now",
    refine_selection: "Refine Selection", all: "All",
    // Product Dictionary
    premium_noise_cancelling_headphones: "Premium Noise-Cancelling Headphones",
    pro_gaming_mouse: "Pro Gaming Mouse",
    ergonomic_mechanical_keyboard: "Ergonomic Mechanical Keyboard",
    ultra_slim_laptop: "Ultra-Slim Laptop",
    smart_home_hub: "Smart Home Hub",
    // Common Categories & Brands
    headphones: "Headphones", smartphones: "Smartphones", laptops: "Laptops", storage_drives: "Storage Drives",
    external_cases: "External Cases", accessories: "Accessories", gaming: "Gaming", audio: "Audio",
    wearables: "Wearables", appliances: "Appliances", networking: "Networking",
    storage_drives: "Storage Drives", desktops: "Desktops", components: "Components",
    // Brands
    bose: "Bose", samsung: "Samsung", sony: "Sony", apple: "Apple", dell: "Dell", hp: "HP",
    lenovo: "Lenovo", asus: "Asus", logitech: "Logitech",
    // Custom Section & Category Labels
    featured_gear: "Featured Gear", handpicked_products_for_you: "Handpicked Products for You",
    external_case_hdd: "External Case HDD", memory_ram: "Memory RAM", earbuds: "Earbuds",
    remote: "Remote", fan: "Fan", speakers: "Speakers", refrigerators: "Refrigerators",
    home_cinema: "Home Cinema", tv_video: "TV & Video", smart_watch: "Smart Watch",
    power_bank: "Power Bank", cables: "Cables", printers: "Printers",
    // Section Subtitle Phrases
    most_popular_on_our_network: "Most Popular on Our Network",
    the_latest_in: "The Latest in", popular_choices_in: "Popular Choices in", the_best_of: "The Best of",
    trending_now: "Trending Now", new_arrival: "New Arrival", just_in: "Just In",
    top_picks_for_you: "Top Picks for You",
    // Wishlist & Checkout
    wishlist_empty: "Your Wishlist is Empty", wishlist_empty_desc: "Your curated collection is waiting. Explore our premium inventory and save your favorites here.",
    explore_products: "Start Discovery", saved_gear: "Saved Gear", item: "Item", items: "Items",
    ready_checkout: "Ready for Checkout", curation_status: "Curation Status",
    // Checkout
    order_received: "Order Received", thank_you_order: "Thank you for your order! Our team in",
    will_contact_you: "will contact you shortly at", to_confirm_delivery: "to confirm the delivery time.",
    payment_method: "Payment Method", cash_on_delivery: "Cash on Delivery", back_to_shop: "Back to Shop",
    back_to_cart: "Back to Cart", delivery_details: "Delivery Details", where_send_package: "Where should we send your package?",
    recipient_name: "Recipient Name", eg_name: "e.g. Yao Kouassi", contact_phone: "Contact Phone",
    city: "City", precise_address: "Precise Address", address_placeholder: "Neighborhood, Building, Door #",
    pay_on_delivery: "Pay on Delivery", payment_collected_doorstep: "Payment will be collected at your doorstep",
    agree_to_pay: "I agree to pay upon delivery and accept the", store_policies: "Store Policies",
    email_me_updates: "Email me with shipping updates and news", placing_order: "Placing Order...",
    confirm_order: "Confirm Order", order_summary: "Order Summary", qty: "Qty",
    voucher_code: "Voucher Code", apply: "Apply", applied: "Applied",
    tax: "Tax", shipping: "Shipping", free: "FREE", total_to_pay: "Total to Pay",
    estimated_delivery: "Estimated Delivery", quality_guarantee: "Quality Guarantee", express_delivery: "Express Delivery",
    full_name: "Full Name",
    profile_photo: "Profile Photo (Optional)",
    name_placeholder: "e.g. Yao Kouassi",
    email_address: "Email Address",
    email_placeholder: "you@example.com",
    contact_phone: "Contact Phone (African country code)",
    phone_placeholder: "e.g. 07070707",
    password: "Password",
    confirm_password: "Confirm Password",
    create_account: "Create Your Account",
    login: "Login",
    sign_up: "Sign Up",
    sign_in: "Sign In",
    remember_me: "Remember Me",
    forgot_password: "Forgot Password?",
    continue_google: "Continue with Google",
    agree_terms: "By continuing, you agree to SWEETO-HUB's",
    privacy_policy: "Privacy Policy",
    premium_experience_by: "Premium Experience by",
    explore_premium_arrivals: "Explore our latest premium arrivals",
    my_wishlist: "My Wishlist",
    check_saved_items: "Check the items you saved for later",
    secure_sign_out: "Secure Sign Out",
    currency: "Currency",
    clear_cache: "Clear Cache",
    sign_in_register: "Sign In / Register"
  },
  fr: {
    // Header & Nav
    home: "Accueil", saved: "Enregistré", profile: "Profil", me: "Moi", cart: "Panier",
    my_orders: "Commandes", settings: "Paramètres", member_since: "Membre depuis", security: "Sécurité", wishlist: "Favoris", hello: "Bonjour",
    search_placeholder: "Recherche premium...", welcome: "Bienvenue", sign_in: "SE CONNECTER", account: "Compte",
    recent_arrivals: "Nouveautés", new: "Nouveau", just_arrived: "Vient d'arriver !", view_all_new: "Voir tout",
    visit_us: "Nous Visiter", language: "Langue", theme: "Thème", notifications: "Notifications", store_tab: "Boutique", chat_tab: "Chat", activity: "Activité",
    // Sidebar & Filters
    home_intelligence: "Accueil Intelligence", luxury_collection: "Collection Luxe", corporate_location: "Siège Social",
    curated_wishlist: "Liste de Souhaits", global_account: "Compte Global", preference_node: "Préférences",
    regional_language: "Langue Régionale", department_core: "Départements", partner_brands: "Marques Partenaires",
    matrix_filter: "Filtre Matrix", optimize_search: "Optimiser la Recherche", no_premium_partners: "Aucun Partenaire",
    units_available: "Unités Disponibles", shop_by: "Acheter par", discover_gear: "Découvrez nos équipements spécialisés",
    // Hero & Banners
    featured_selection: "Sélection Vedette", explore_now: "Explorer", exclusive_showcase: "Vitrine Exclusive",
    starting_at: "À partir de", discount: "Remise", active_now: "Actif maintenant", view_product: "Voir le Produit",
    claim_offer: "Profiter de l'offre", video_commercial: "Publicité Vidéo", premium_banner: "Bannière Premium",
    exclusive_tech_deals: "Offres Tech Exclusives", discover_deals: "Découvrir les Offres",
    // Products & Cart
    view_all: "Voir Tout", add_to_cart: "Ajouter au Panier", out_of_stock: "Rupture de Stock", in_stock: "En Stock",
    your_cart: "Votre Panier", checkout: "Passer la commande", total: "Total", empty_cart: "Votre panier est vide",
    continue_shopping: "Continuer mes achats", subtotal: "Sous-total", taxes_calculated: "Taxes calculées à la caisse",
    remove: "Supprimer", color: "Couleur", size: "Taille", quantity: "Quantité", description: "Description", features: "Caractéristiques", reviews: "Avis",
    default_product_desc: "Découvrez le summum de la technologie et du design avec cet appareil haute performance, conçu pour les utilisateurs les plus exigeants.",
    premium_material_desc: "Nos maîtres artisans ont conçu ce produit en utilisant uniquement les meilleurs matériaux de qualité supérieure. Chaque courbe et composant est méticuleusement testé pour s'assurer qu'il répond à nos normes rigoureuses d'excellence et de durabilité.",
    big_performance_sleek_design: "Grande performance design élégant", premium_collection: "Collection Premium", discover_latest_tech: "Découvrez les dernières technologies haut de gamme",
    premium_edition: "Édition Premium", sold: "Vendu", discover_product: "Découvrir le Produit", buy_now: "Acheter Maintenant",
    feedback: "Retours", global_intel: "Infos Globales", community_rating: "Évaluation de la communauté",
    leave_review: "Laisser votre avis", share_experience: "Partagez votre expérience...", submit_experience: "Envoyer l'avis",
    related: "Produits Associés", you_might_also_like: "Vous Aimerez Aussi", curated_for_you: "Sélection Spéciale",
    verified_authentic: "Stock Authentique Vérifié", login_now: "Connectez-vous pour continuer", products: "Produits",
    premium_items: "Articles Premium", select_gear: "Sélectionnez votre équipement", local_handling: "Traitement Local", gratis: "GRATUIT",
    elite_offer: "Offre Élite", video_promo: "Promo Vidéo", explore_all: "Explorer Tout", view_cart: "Voir le Panier", checkout_now: "Commander",
    // Footer & Misc
    get_directions: "Itinéraire", call_support: "Support", stay_connected: "Rester Connecté",
    about_hub: "À propos de Sweeto-Hub",
    about_desc: "SWEETO-HUB est votre boutique d'électronique haut de gamme de confiance à Abidjan. Nous apportons le meilleur de la technologie mondiale directement à votre porte.",
    explore_categories: "Explorer les Catégories",
    location_schedule: "Emplacement et Horaires",
    physical_store: "Boutique Physique",
    opening_hours: "Heures d'ouverture",
    exclusive_daily_discounts: "Ventes Flash Quotidiennes",
    subscribe_desc: "Rejoignez notre cercle d'élite pour un accès anticipé aux nouveautés premium et aux exclusivités du hub.",
    enter_email: "SAISISSEZ VOTRE EMAIL", subscriber_join: "REJOINDRE LE HUB", secure_spam_free: "SÉCURISÉ ET SANS SPAM",
    privacy: "Confidentialité", terms: "Conditions", security: "Sécurité",
    welcome_hub: "Bienvenue sur le Hub", check_inbox: "Vérifiez votre boîte de réception pour des offres exclusives",
    // Categories & Sort
    our_top_categories: "Nos Meilleures Catégories",
    explore_curated: "Explorez des produits sélectionnés par départements premium",
    categories: "Catégories", all_products: "Tous les Produits", daily_deals: "Offres du Jour", trending: "Tendances", new_arrivals: "Nouveautés",
    sort_by: "Trier par :", name_az: "Nom (A-Z)", price_low_high: "Prix : du moins cher au plus cher", price_high_low: "Prix : du plus cher au moins cher", latest_arrivals: "Dernières nouveautés",
    back: "Retour", discovery: "Découverte", deal_of_day: "Offre du Jour", featured_items: "Articles Vedettes",
    search_results: "Résultats de Recherche", found_matches: "Correspondances premium trouvées", premium_selection: "Sélection Premium de",
    discover_full_range: "Découvrez notre gamme complète", recently_viewed: "Récemment consultés", tech_history: "Votre historique technique",
    featured: "Vedette", shop_now: "Acheter Maintenant",
    refine_selection: "Affiner la sélection", all: "Tout",
    // Product Dictionary
    premium_noise_cancelling_headphones: "Casque premium à réduction de bruit",
    pro_gaming_mouse: "Souris gaming pro",
    ergonomic_mechanical_keyboard: "Clavier mécanique ergonomique",
    ultra_slim_laptop: "Ordinateur portable ultra-fin",
    smart_home_hub: "Hub domotique intelligent",
    // Common Categories & Brands
    headphones: "Casques", smartphones: "Smartphones", laptops: "Ordinateurs portables", storage_drives: "Disques de stockage",
    external_cases: "Boîtiers externes", accessories: "Accessoires", gaming: "Jeux", audio: "Audio",
    wearables: "Objets connectés", appliances: "Électroménager", networking: "Réseaux",
    desktops: "Ordinateurs de bureau", components: "Composants",
    // Brands
    bose: "Bose", samsung: "Samsung", sony: "Sony", apple: "Apple", dell: "Dell", hp: "HP",
    lenovo: "Lenovo", asus: "Asus", logitech: "Logitech",
    // Custom Section & Category Labels
    featured_gear: "Équipement vedette", handpicked_products_for_you: "Produits sélectionnés pour vous",
    external_case_hdd: "Boîtier HDD externe", memory_ram: "Mémoire RAM", earbuds: "Écouteurs",
    remote: "Télécommande", fan: "Ventilateur", speakers: "Haut-parleurs", refrigerators: "Réfrigérateurs",
    home_cinema: "Cinéma maison", tv_video: "TV & Vidéo", smart_watch: "Montre connectée",
    power_bank: "Batterie externe", cables: "Câbles", printers: "Imprimantes",
    // Section Subtitle Phrases
    most_popular_on_our_network: "Le plus populaire sur notre réseau",
    the_latest_in: "Le dernier cri en", popular_choices_in: "Choix populaires en", the_best_of: "Le meilleur de",
    trending_now: "Tendance actuelle", new_arrival: "Nouvelle arrivée", just_in: "Tout juste arrivé",
    top_picks_for_you: "Meilleurs choix pour vous",
    // Wishlist & Checkout
    wishlist_empty: "Votre liste de favoris est vide", wishlist_empty_desc: "Votre collection vous attend. Explorez notre inventaire premium et enregistrez vos favoris ici.",
    explore_products: "Commencer la découverte", saved_gear: "Équipement enregistré", item: "Article", items: "Articles",
    ready_checkout: "Prêt pour la caisse", curation_status: "Statut de curation",
    // Checkout
    order_received: "Commande reçue", thank_you_order: "Merci pour votre commande ! Notre équipe à",
    will_contact_you: "vous contactera sous peu au", to_confirm_delivery: "pour confirmer l'heure de livraison.",
    payment_method: "Mode de paiement", cash_on_delivery: "Paiement à la livraison", back_to_shop: "Retour à la boutique",
    back_to_cart: "Retour au panier", delivery_details: "Détails de la livraison", where_send_package: "Où devons-nous envoyer votre colis ?",
    recipient_name: "Nom du destinataire", eg_name: "ex. Yao Kouassi", contact_phone: "Téléphone de contact",
    city: "Ville", precise_address: "Adresse précise", address_placeholder: "Quartier, Bâtiment, Porte #",
    pay_on_delivery: "Payer à la livraison", payment_collected_doorstep: "Le paiement sera collecté à votre porte",
    agree_to_pay: "J'accepte de payer à la livraison et j'accepte les", store_policies: "Politiques du magasin",
    email_me_updates: "Envoyez-moi des mises à jour sur l'expédition et des nouvelles", placing_order: "Passage de la commande...",
    confirm_order: "Confirmer la commande", order_summary: "Résumé de la commande", qty: "Qté",
    voucher_code: "Code promo", apply: "Appliquer", applied: "Appliqué",
    tax: "Taxe", shipping: "Livraison", free: "GRATUIT", total_to_pay: "Total à payer",
    estimated_delivery: "Livraison estimée", quality_guarantee: "Garantie de qualité", express_delivery: "Livraison express",
    full_name: "Nom complet",
    profile_photo: "Photo de profil (Optionnel)",
    name_placeholder: "ex. Yao Kouassi",
    email_address: "Adresse e-mail",
    email_placeholder: "vous@exemple.com",
    contact_phone: "Téléphone de contact (Indicatif pays africain)",
    phone_placeholder: "ex. 07070707",
    password: "Mot de passe",
    confirm_password: "Confirmer le mot de passe",
    create_account: "Créer votre compte",
    login: "Connexion",
    sign_up: "S'inscrire",
    sign_in: "Se connecter",
    remember_me: "Se souvenir de moi",
    forgot_password: "Mot de passe oublié ?",
    continue_google: "Continuer avec Google",
    agree_terms: "En continuant, vous acceptez les conditions de SWEETO-HUB",
    privacy_policy: "Politique de confidentialité",
    premium_experience_by: "Expérience premium par",
    explore_premium_arrivals: "Explorez nos dernières nouveautés premium",
    my_wishlist: "Ma liste de favoris",
    check_saved_items: "Vérifiez les articles enregistrés pour plus tard",
    secure_sign_out: "Déconnexion sécurisée",
    currency: "Devise",
    clear_cache: "Vider le cache",
    sign_in_register: "Se connecter / S'inscrire"
  },
  es: {
    // Header & Nav
    home: "Inicio", saved: "Guardado", profile: "Perfil", me: "Yo", cart: "Carrito",
    my_orders: "Pedidos", settings: "Ajustes", member_since: "Miembro desde", security: "Seguridad", wishlist: "Favoritos", hello: "Hola",
    search_placeholder: "Búsqueda premium...", welcome: "Bienvenido", sign_in: "INICIAR SESIÓN", account: "Cuenta",
    recent_arrivals: "Recién Llegados", new: "Nuevo", just_arrived: "¡Recién llegado!", view_all_new: "Ver todo",
    visit_us: "Visítanos", language: "Idioma", theme: "Tema", notifications: "Notificaciones", store_tab: "Tienda", activity: "Actividad",
    // Sidebar & Filters
    home_intelligence: "Inteligencia Hogar", luxury_collection: "Colección Lujo", corporate_location: "Ubicación Corporativa",
    curated_wishlist: "Lista Deseos", global_account: "Cuenta Global", preference_node: "Preferencias",
    regional_language: "Idioma Regional", department_core: "Departamentos", partner_brands: "Marcas Asociadas",
    matrix_filter: "Filtro Matrix", optimize_search: "Optimizar Búsqueda", no_premium_partners: "Sin Socios",
    units_available: "Unidades Disponibles", shop_by: "Comprar por", discover_gear: "Descubre equipos especializados",
    // Hero & Banners
    featured_selection: "Selección Destacada", explore_now: "Explorar Ahora", exclusive_showcase: "Muestra Exclusiva",
    starting_at: "Desde", discount: "Descuento", active_now: "Activo Ahora", view_product: "Ver Producto",
    claim_offer: "Reclamar Oferta", video_commercial: "Video Comercial", premium_banner: "Banner Premium",
    exclusive_tech_deals: "Ofertas Tech Exclusivas", discover_deals: "Descubrir Ofertas",
    // Products & Cart
    view_all: "Ver Todo", add_to_cart: "Añadir al Carrito", out_of_stock: "Agotado", in_stock: "En Stock",
    your_cart: "Tu Carrito", checkout: "Pagar", total: "Total", empty_cart: "Tu carrito está vacío",
    continue_shopping: "Seguir Comprando", subtotal: "Subtotal", taxes_calculated: "Impuestos calculados en el pago",
    remove: "Quitar", color: "Color", size: "Tamaño", quantity: "Cantidad", description: "Descripción", features: "Características", reviews: "Reseñas",
    premium_edition: "Edición Premium", sold: "Vendido", discover_product: "Descubrir", buy_now: "Comprar Ahora",
    feedback: "Comentarios", global_intel: "Inteligencia Global", community_rating: "Calificación Comunidad",
    leave_review: "Deja tu huella", share_experience: "Comparte tu experiencia...", submit_experience: "Enviar Comentario",
    related: "Relacionado", you_might_also_like: "Te Podría Gustar", curated_for_you: "Selección Curada",
    verified_authentic: "Stock Auténtico Verificado", login_now: "Inicia sesión para continuar", products: "Productos",
    premium_items: "Artículos Premium", select_gear: "Selecciona tu equipo", local_handling: "Manejo Local", gratis: "GRATIS",
    elite_offer: "Oferta Élite", video_promo: "Promo de Video", explore_all: "Explorar Todo", view_cart: "Ver Carrito", checkout_now: "Pagar Ahora",
    // Footer & Misc
    get_directions: "Direcciones", call_support: "Soporte", stay_connected: "Mantente Conectado",
    subscribe_desc: "Únete a nuestro círculo de élite para acceso anticipado a lanzamientos premium.",
    enter_email: "INGRESA TU EMAIL", subscriber_join: "ÚNETE AL HUB", secure_spam_free: "SEGURO Y SIN SPAM",
    privacy: "Privacidad", terms: "Términos", security: "Seguridad",
    welcome_hub: "Bienvenido al Hub", check_inbox: "Revisa tu bandeja de entrada para ofertas exclusivas",
    // Categories & Sort
    categories: "Categorías", all_products: "Todos los Productos", daily_deals: "Ofertas del Día", trending: "Tendencias", new_arrivals: "Nuevos",
    sort_by: "Ordenar por:", name_az: "Nombre (A-Z)", price_low_high: "Precio: Menor a Mayor", price_high_low: "Precio: Mayor a Menor", latest_arrivals: "Últimos",
    back: "Volver", discovery: "Descubrimiento", deal_of_day: "Oferta del Día", featured_items: "Destacados",
    search_results: "Resultados", found_matches: "Coincidencias premium", premium_selection: "Selección Premium de",
    discover_full_range: "Descubre Nuestra Gama", recently_viewed: "Vistos Recientemente", tech_history: "Tu Historial Tech",
    featured: "Destacado", shop_now: "Comprar",
    refine_selection: "Refinar Selección", all: "Todo",
    // Product Dictionary
    premium_noise_cancelling_headphones: "Auriculares con cancelación de ruido",
    pro_gaming_mouse: "Ratón gaming profesional",
    ergonomic_mechanical_keyboard: "Teclado mecánico ergonómico",
    ultra_slim_laptop: "Portátil ultra delgado",
    smart_home_hub: "Hub inteligente para el hogar",
    // Common Categories & Brands
    headphones: "Auriculares", smartphones: "Smartphones", laptops: "Portátiles", storage_drives: "Almacenamiento",
    external_cases: "Carcasas Externas", accessories: "Accesorios", gaming: "Juegos", audio: "Audio",
    wearables: "Wearables", appliances: "Electrodomésticos", networking: "Redes",
    storage_drives: "Unidades de Almacenamiento", desktops: "Sobremesa", components: "Componentes",
    // Brands
    bose: "Bose", samsung: "Samsung", sony: "Sony", apple: "Apple", dell: "Dell", hp: "HP",
    lenovo: "Lenovo", asus: "Asus", logitech: "Logitech",
    // Custom Section & Category Labels
    featured_gear: "Equipamiento Destacado", handpicked_products_for_you: "Productos Seleccionados para Ti",
    external_case_hdd: "Carcasa HDD Externa", memory_ram: "Memoria RAM", earbuds: "Auriculares Inalámbricos",
    remote: "Mando", fan: "Ventilador", speakers: "Altavoces", refrigerators: "Refrigeradores",
    home_cinema: "Cine en Casa", tv_video: "TV y Vídeo", smart_watch: "Reloj Inteligente",
    power_bank: "Batería Portátil", cables: "Cables", printers: "Impresoras",
    // Section Subtitle Phrases
    most_popular_on_our_network: "Lo Más Popular de Nuestra Red",
    the_latest_in: "Lo Último en", popular_choices_in: "Opciones Populares en", the_best_of: "Lo Mejor de",
    trending_now: "Tendencias Ahora", new_arrival: "Nueva Llegada", just_in: "Recién Llegado",
    top_picks_for_you: "Las Mejores Opciones para Ti",
    // Wishlist & Checkout
    wishlist_empty: "Tu lista de deseos está vacía", wishlist_empty_desc: "Tu colección seleccionada está esperando. Explora nuestro inventario premium y guarda tus favoritos aquí.",
    explore_products: "Comenzar el descubrimiento", saved_gear: "Equipo Guardado", item: "Artículo", items: "Artículos",
    ready_checkout: "Listo para el pago", curation_status: "Estado de curación"
  },
  de: {
    home: "Startseite", store_tab: "Shop", saved: "Gespeichert", profile: "Profil", me: "Ich", cart: "Warenkorb",
    my_orders: "Bestellungen", settings: "Einstellungen", member_since: "Mitglied seit", security: "Sicherheit", wishlist: "Wunschliste", hello: "Hallo",
    search_placeholder: "Premium Suche...", welcome: "Willkommen", sign_in: "ANMELDEN", account: "Konto",
    recent_arrivals: "Neuankömmlinge", new: "Neu", just_arrived: "Gerade eingetroffen!", view_all_new: "Alle ansehen",
    experience_hub: "Erlebe Sweeto Hub", visit_store: "Besuchen Sie unseren", physical_store: "Physischen Laden",
    store_desc: "Erkunden Sie unsere Premium-Technikkollektion persönlich. Unsere Experten helfen Ihnen gerne weiter.",
    our_address: "Unsere Adresse", opening_hours: "Öffnungszeiten", mon_fri: "Mo-Fr", saturday: "Samstag", sunday: "Sonntag", closed: "Geschlossen",
    get_directions: "Route finden", call_support: "Support anrufen", about_hub: "Über Unseren Hub",
    about_desc: "SWEETO-HUB ist Ihr lokales Ziel für Premium-Elektronik. Wir verbinden globale Technologie mit lokaler Zugänglichkeit.",
    explore_categories: "Kategorien", our_location: "Unser Standort", physical_address: "Physische Adresse",
    service_area: "Servicebereich", nationwide_delivery: "Landesweite Lieferung", open_maps: "In Google Maps öffnen",
    stay_connected: "Bleiben Sie in Verbindung", subscribe_desc: "Abonnieren Sie Updates zu neuen Produkten und Flash-Sales.",
    enter_email: "E-Mail eingeben...", join_subscribers: "WERDEN SIE EINER VON 2.500+ ABONNENTEN",
    privacy: "Datenschutz", terms: "Bedingungen", security: "Sicherheit",
    view_all: "Alle ansehen", add_to_cart: "In den Warenkorb", out_of_stock: "Ausverkauft",
    your_cart: "Ihr Warenkorb", checkout: "Kasse", total: "Gesamt", empty_cart: "Ihr Warenkorb ist leer",
    continue_shopping: "Weiter einkaufen", subtotal: "Zwischensumme", taxes_calculated: "Steuern werden an der Kasse berechnet",
    remove: "Entfernen", color: "Farbe", size: "Größe", quantity: "Menge", description: "Beschreibung", features: "Funktionen", reviews: "Bewertungen",
    categories: "Kategorien", all_products: "Alle Produkte", daily_deals: "Tagesangebote", trending: "Im Trend", new_arrivals: "Neuankömmlinge",
    sort_by: "Sortieren nach:", name_az: "Name (A-Z)", price_low_high: "Preis: Niedrig bis Hoch", price_high_low: "Preis: Hoch bis Niedrig", latest_arrivals: "Neueste",
    back: "Zurück", discovery: "Entdeckung", deal_of_day: "Angebot des Tages", featured_items: "Vorgestellte Artikel",
    search_results: "Suchergebnisse", found_matches: "Premium-Treffer gefunden", premium_selection: "Premium-Auswahl an",
    discover_full_range: "Entdecken Sie unser gesamtes Sortiment", recently_viewed: "Zuletzt angesehen", tech_history: "Ihre Technik-Historie",
    featured: "Vorgestellt", shop_now: "Jetzt Kaufen",
    // Hero & Banners
    featured_selection: "Ausgewählte Auswahl", explore_now: "Jetzt Erkunden", exclusive_showcase: "Exklusive Präsentation",
    starting_at: "Ab", discount: "Rabatt", active_now: "Jetzt Aktiv", view_product: "Produkt Ansehen",
    claim_offer: "Angebot Einlösen", video_commercial: "Video-Werbung", premium_banner: "Premium-Banner",
    exclusive_tech_deals: "Exklusive Tech-Angebote", discover_deals: "Angebote Entdecken",
    // Products & Cart
    premium_edition: "Premium Edition", sold: "Verkauft", discover_product: "Produkt Entdecken", buy_now: "Jetzt Kaufen",
    feedback: "Feedback", global_intel: "Globale Informationen", community_rating: "Community-Bewertung",
    leave_review: "Hinterlassen Sie Ihre Nachricht", share_experience: "Teilen Sie Ihre Erfahrung...", submit_experience: "Erfahrung Senden",
    related: "Ähnliche Produkte", you_might_also_like: "Das Könnte Ihnen Auch Gefallen", curated_for_you: "Für Sie Kuratiert",
    verified_authentic: "Geprüfter Authentischer Bestand", login_now: "Anmelden zum Fortfahren", products: "Produkte",
    premium_items: "Premium-Artikel", select_gear: "Wählen Sie Ihre Ausrüstung", local_handling: "Lokale Abwicklung", gratis: "KOSTENLOS",
    elite_offer: "Elite-Angebot", video_promo: "Video-Promotion", explore_all: "Alles Erkunden", view_cart: "Warenkorb Anzeigen", checkout_now: "Jetzt Bezahlen",
    // Footer & Misc
    subscriber_join: "DEM HUB BEITRETEN", secure_spam_free: "SICHER & SPAM-FREI",
    welcome_hub: "Willkommen im Hub", check_inbox: "Prüfen Sie Ihren Posteingang für exklusive Angebote",
    refine_selection: "Auswahl Verfeinern", all: "Alle",
    // Product Dictionary
    premium_noise_cancelling_headphones: "Premium Kopfhörer mit Geräuschunterdrückung",
    pro_gaming_mouse: "Pro Gaming Maus",
    ergonomic_mechanical_keyboard: "Ergonomische mechanische Tastatur",
    ultra_slim_laptop: "Ultraflacher Laptop",
    smart_home_hub: "Smart Home Hub",
    // Custom Section & Category Labels
    headphones: "Kopfhörer", smartphones: "Smartphones", laptops: "Laptops",
    external_cases: "Externe Gehäuse", accessories: "Zubehör", gaming: "Gaming", audio: "Audio",
    wearables: "Wearables", appliances: "Haushaltsgeräte", networking: "Netzwerk",
    featured_gear: "Ausgewähltes Equipment", handpicked_products_for_you: "Handgepickte Produkte für Sie",
    external_case_hdd: "Externes HDD-Gehäuse", memory_ram: "Arbeitsspeicher", earbuds: "Ohrkopfhörer",
    remote: "Fernbedienung", fan: "Lüfter", speakers: "Lautsprecher", refrigerators: "Kühlschränke",
    home_cinema: "Heimkino", tv_video: "TV & Video", smart_watch: "Smartwatch",
    power_bank: "Powerbank", cables: "Kabel", printers: "Drucker",
    // Section Subtitle Phrases
    most_popular_on_our_network: "Beliebteste in Unserem Netzwerk",
    the_latest_in: "Das Neueste in", popular_choices_in: "Beliebte Auswahl in", the_best_of: "Das Beste aus",
    trending_now: "Jetzt im Trend", new_arrival: "Neuer Artikel", just_in: "Gerade Eingetroffen",
    top_picks_for_you: "Top-Auswahl für Sie",
    // Wishlist & Checkout
    wishlist_empty: "Ihre Wunschliste ist leer", wishlist_empty_desc: "Ihre kuratierte Sammlung wartet auf Sie. Erkunden Sie unser Premium-Inventar und speichern Sie hier Ihre Favoriten.",
    explore_products: "Entdeckung starten", saved_gear: "Gespeicherte Ausrüstung", item: "Artikel", items: "Artikel",
    ready_checkout: "Bereit zur Kasse", curation_status: "Kuratierungsstatus"
  },
  it: {
    home: "Home", store_tab: "Negozio", saved: "Salvato", profile: "Profilo", me: "Io", cart: "Carrello",
    my_orders: "Ordini", settings: "Impostazioni", member_since: "Membro da", security: "Sicurezza", wishlist: "Preferiti", hello: "Ciao",
    search_placeholder: "Ricerca premium...", welcome: "Benvenuto", sign_in: "ACCEDI", account: "Account",
    recent_arrivals: "Nuovi Arrivi", new: "Nuovo", just_arrived: "Appena arrivato!", view_all_new: "Vedi tutto",
    experience_hub: "Vivi Sweeto Hub", visit_store: "Visita il Nostro", physical_store: "Negozio Fisico",
    store_desc: "Vieni ad esplorare di persona la nostra collezione tech. I nostri esperti ti aiuteranno.",
    our_address: "Il Nostro Indirizzo", opening_hours: "Orari di Apertura", mon_fri: "Lun-Ven", saturday: "Sabato", sunday: "Domenica", closed: "Chiuso",
    get_directions: "Indicazioni", call_support: "Chiama Supporto", about_hub: "Riguardo Noi",
    about_desc: "SWEETO-HUB è la tua destinazione per l'elettronica premium. Tecnologia globale, accessibilità locale.",
    explore_categories: "Esplora le Categorie", our_location: "La Nostra Posizione", physical_address: "Indirizzo Fisico",
    service_area: "Area di Servizio", nationwide_delivery: "Consegna Nazionale Attiva", open_maps: "Apri in Google Maps",
    stay_connected: "Resta Connesso", subscribe_desc: "Iscriviti per ricevere aggiornamenti, flash sales ed esclusive.",
    enter_email: "Inserisci la tua email...", join_subscribers: "UNISCITI A +2500 ISCRITTI",
    privacy: "Privacy", terms: "Termini", security: "Sicurezza",
    view_all: "Vedi Tutto", add_to_cart: "Aggiungi al Carrello", out_of_stock: "Esaurito",
    your_cart: "Il Tuo Carrello", checkout: "Cassa", total: "Totale", empty_cart: "Il tuo carrello è vuoto",
    continue_shopping: "Continua lo Shopping", subtotal: "Subtotale", taxes_calculated: "Tasse calcolate al checkout",
    remove: "Rimuovi", color: "Colore", size: "Taglia", quantity: "Quantità", description: "Descrizione", features: "Caratteristiche", reviews: "Recensioni",
    categories: "Categorie", all_products: "Tutti i Prodotti", daily_deals: "Offerte del Giorno", trending: "Tendenze", new_arrivals: "Nuovi Arrivi",
    sort_by: "Ordina per:", name_az: "Nome (A-Z)", price_low_high: "Prezzo: Crescente", price_high_low: "Prezzo: Decrescente", latest_arrivals: "Ultimi Arrivi",
    back: "Indietro", discovery: "Scoperta", deal_of_day: "Offerta del Giorno", featured_items: "Articoli in Primo Piano",
    search_results: "Risultati", found_matches: "Corrispondenze premium", premium_selection: "Selezione Premium di",
    discover_full_range: "Scopri la Nostra Gamma", recently_viewed: "Visti di Recente", tech_history: "Tua Cronologia Tech",
    featured: "In Primo Piano", shop_now: "Acquista",
    // Hero & Banners
    featured_selection: "Selezione In Primo Piano", explore_now: "Esplora Ora", exclusive_showcase: "Vetrina Esclusiva",
    starting_at: "A partire da", discount: "Sconto", active_now: "Attivo Ora", view_product: "Vedi Prodotto",
    claim_offer: "Richiedi Offerta", video_commercial: "Spot Video", premium_banner: "Banner Premium",
    exclusive_tech_deals: "Offerte Tech Esclusive", discover_deals: "Scopri Offerte",
    // Products & Cart
    premium_edition: "Edizione Premium", sold: "Venduto", discover_product: "Scopri Prodotto", buy_now: "Acquista Ora",
    feedback: "Feedback", global_intel: "Info Globali", community_rating: "Valutazione Community",
    leave_review: "Lascia il tuo segno", share_experience: "Condividi la tua esperienza...", submit_experience: "Invia Esperienza",
    related: "Correlati", you_might_also_like: "Potrebbe Piacerti Anche", curated_for_you: "Curati per Te",
    verified_authentic: "Stock Autentico Verificato", login_now: "Accedi per Continuare", products: "Prodotti",
    premium_items: "Articoli Premium", select_gear: "Seleziona la tua attrezzatura", local_handling: "Gestione Locale", gratis: "GRATIS",
    elite_offer: "Offerta Elite", video_promo: "Promo Video", explore_all: "Esplora Tutto", view_cart: "Vedi Carrello", checkout_now: "Paga Ora",
    // Footer & Misc
    subscriber_join: "UNISCITI AL HUB", secure_spam_free: "SICURO E SENZA SPAM",
    welcome_hub: "Benvenuto nel Hub", check_inbox: "Controlla la tua email per offerte esclusive",
    refine_selection: "Affina Selezione", all: "Tutti",
    // Product Dictionary
    premium_noise_cancelling_headphones: "Cuffie premium con cancellazione rumore",
    pro_gaming_mouse: "Mouse da gaming professionale",
    ergonomic_mechanical_keyboard: "Tastiera meccanica ergonomica",
    ultra_slim_laptop: "Laptop ultra sottile",
    smart_home_hub: "Hub domotico intelligente",
    // Custom Section & Category Labels
    headphones: "Cuffie", smartphones: "Smartphone", laptops: "Laptop",
    external_cases: "Case Esterne", accessories: "Accessori", gaming: "Gaming", audio: "Audio",
    wearables: "Indossabili", appliances: "Elettrodomestici", networking: "Rete",
    featured_gear: "Attrezzatura in Primo Piano", handpicked_products_for_you: "Prodotti Scelti per Te",
    external_case_hdd: "Case HDD Esterno", memory_ram: "Memoria RAM", earbuds: "Auricolari",
    remote: "Telecomando", fan: "Ventilatore", speakers: "Altoparlanti", refrigerators: "Frigoriferi",
    home_cinema: "Home Cinema", tv_video: "TV e Video", smart_watch: "Smartwatch",
    power_bank: "Powerbank", cables: "Cavi", printers: "Stampanti",
    // Section Subtitle Phrases
    most_popular_on_our_network: "Il Più Popolare della Nostra Rete",
    the_latest_in: "L'Ultimo in", popular_choices_in: "Scelte Popolari in", the_best_of: "Il Meglio di",
    trending_now: "Di Tendenza Ora", new_arrival: "Nuova Aggiunta", just_in: "Appena Arrivato",
    top_picks_for_you: "Le Migliori Scelte per Te"
  },
  pt: {
    home: "Início", store_tab: "Loja", saved: "Salvo", profile: "Perfil", me: "Eu", cart: "Carrinho",
    my_orders: "Pedidos", settings: "Configurações", member_since: "Membro desde", security: "Segurança", wishlist: "Favoritos", hello: "Olá",
    search_placeholder: "Pesquisa premium...", welcome: "Bem-vindo", sign_in: "ENTRAR", account: "Conta",
    recent_arrivals: "Recém-chegados", new: "Novo", just_arrived: "Acabou de chegar!", view_all_new: "Ver tudo",
    experience_hub: "Experimente o Sweeto Hub", visit_store: "Visite a Nossa", physical_store: "Loja Física",
    store_desc: "Venha explorar nossa coleção tech premium. Nossos especialistas estão prontos para ajudar.",
    our_address: "Nosso Endereço", opening_hours: "Horário de Funcionamento", mon_fri: "Seg-Sex", saturday: "Sábado", sunday: "Domingo", closed: "Fechado",
    get_directions: "Como Chegar", call_support: "Ligar para Suporte", about_hub: "Sobre o Hub",
    about_desc: "SWEETO-HUB é seu destino local para eletrônicos premium. Tecnologia global ao seu alcance.",
    explore_categories: "Explorar Categorias", our_location: "Nossa Localização", physical_address: "Endereço Físico",
    service_area: "Área de Atendimento", nationwide_delivery: "Entrega Nacional Ativa", open_maps: "Abrir no Google Maps",
    stay_connected: "Mantenha-se Conectado", subscribe_desc: "Inscreva-se para atualizações e ofertas exclusivas.",
    enter_email: "Digite seu email...", join_subscribers: "JUNTE-SE A +2500 INSCRITOS",
    privacy: "Privacidade", terms: "Termos", security: "Segurança",
    view_all: "Ver Tudo", add_to_cart: "Adicionar ao Carrinho", out_of_stock: "Esgotado",
    your_cart: "Seu Carrinho", checkout: "Finalizar Compra", total: "Total", empty_cart: "Seu carrinho está vazio",
    continue_shopping: "Continuar Comprando", subtotal: "Subtotal", taxes_calculated: "Impostos calculados no checkout",
    remove: "Remover", color: "Cor", size: "Tamanho", quantity: "Quantidade", description: "Descrição", features: "Características", reviews: "Avaliações",
    categories: "Categorias", all_products: "Todos os Produtos", daily_deals: "Ofertas do Dia", trending: "Tendências", new_arrivals: "Novidades",
    sort_by: "Ordenar por:", name_az: "Nome (A-Z)", price_low_high: "Preço: Menor ao Maior", price_high_low: "Preço: Maior ao Menor", latest_arrivals: "Mais Recentes",
    back: "Voltar", discovery: "Descoberta", deal_of_day: "Oferta do Dia", featured_items: "Destaques",
    search_results: "Resultados", found_matches: "Combinações premium", premium_selection: "Seleção Premium de",
    discover_full_range: "Descubra Nossa Linha Completa", recently_viewed: "Vistos Recentemente", tech_history: "Seu Histórico Tech",
    featured: "Destaque", shop_now: "Comprar",
    // Hero & Banners
    featured_selection: "Seleção em Destaque", explore_now: "Explorar Agora", exclusive_showcase: "Vitrine Exclusiva",
    starting_at: "A partir de", discount: "Desconto", active_now: "Ativo Agora", view_product: "Ver Produto",
    claim_offer: "Reivindicar Oferta", video_commercial: "Comercial de Vídeo", premium_banner: "Banner Premium",
    exclusive_tech_deals: "Ofertas Tech Exclusivas", discover_deals: "Descobrir Ofertas",
    // Products & Cart
    premium_edition: "Edição Premium", sold: "Vendido", discover_product: "Descobrir Produto", buy_now: "Comprar Agora",
    feedback: "Feedback", global_intel: "Informação Global", community_rating: "Avaliação da Comunidade",
    leave_review: "Deixe sua marca", share_experience: "Compartilhe sua experiência...", submit_experience: "Enviar Experiência",
    related: "Relacionados", you_might_also_like: "Você Também Pode Gostar", curated_for_you: "Curado para Você",
    verified_authentic: "Estoque Autêntico Verificado", login_now: "Entrar para Continuar", products: "Produtos",
    premium_items: "Itens Premium", select_gear: "Selecione seu equipamento", local_handling: "Manuseio Local", gratis: "GRÁTIS",
    elite_offer: "Oferta Elite", video_promo: "Promo de Vídeo", explore_all: "Explorar Tudo", view_cart: "Ver Carrinho", checkout_now: "Pagar Agora",
    // Footer & Misc
    subscriber_join: "JUNTE-SE AO HUB", secure_spam_free: "SEGURO E SEM SPAM",
    welcome_hub: "Bem-vindo ao Hub", check_inbox: "Verifique seu e-mail para ofertas exclusivas",
    refine_selection: "Refinar Seleção", all: "Tudo",
    // Product Dictionary
    premium_noise_cancelling_headphones: "Fones premium com cancelamento de ruído",
    pro_gaming_mouse: "Mouse gamer profissional",
    ergonomic_mechanical_keyboard: "Teclado mecânico ergonômico",
    ultra_slim_laptop: "Notebook ultra fino",
    smart_home_hub: "Hub para casa inteligente",
    // Custom Section & Category Labels
    headphones: "Fones de Ouvido", smartphones: "Smartphones", laptops: "Notebooks",
    external_cases: "Cases Externos", accessories: "Acessórios", gaming: "Jogos", audio: "Áudio",
    wearables: "Wearables", appliances: "Eletrodomésticos", networking: "Redes",
    featured_gear: "Equipamento em Destaque", handpicked_products_for_you: "Produtos Selecionados para Você",
    external_case_hdd: "Case HDD Externo", memory_ram: "Memória RAM", earbuds: "Fones sem Fio",
    remote: "Controle Remoto", fan: "Ventilador", speakers: "Caixas de Som", refrigerators: "Geladeiras",
    home_cinema: "Home Theater", tv_video: "TV e Vídeo", smart_watch: "Smartwatch",
    power_bank: "Power Bank", cables: "Cabos", printers: "Impressoras",
    // Section Subtitle Phrases
    most_popular_on_our_network: "Mais Popular da Nossa Rede",
    the_latest_in: "O Mais Recente em", popular_choices_in: "Escolhas Populares em", the_best_of: "O Melhor de",
    trending_now: "Em Alta Agora", new_arrival: "Nova Chegada", just_in: "Reciém Chegado",
    top_picks_for_you: "Melhores Opções para Você",
    // Wishlist & Checkout
    wishlist_empty: "Sua lista de desejos está vazia", wishlist_empty_desc: "Sua coleção selecionada está esperando. Explore nosso inventário premium e salve seus favoritos aqui.",
    explore_products: "Começar a Descoberta", saved_gear: "Equipamento Salvo", item: "Item", items: "Itens",
    ready_checkout: "Pronto para o Checkout", curation_status: "Status de Curadoria"
  },
  ar: {
    home: "الرئيسية", store_tab: "المتجر", saved: "محفوظ", profile: "الملف الشخصي", me: "أنا", cart: "السلة",
    my_orders: "الطلبات", settings: "الإعدادات", member_since: "عضو منذ", security: "الأمان", wishlist: "المفضلة", hello: "مرحباً",
    search_placeholder: "ابحث عن المنتجات...", welcome: "مرحباً", sign_in: "تسجيل الدخول", account: "حساب",
    recent_arrivals: "وصل حديثاً", new: "جديد", just_arrived: "وصل للتو!", view_all_new: "عرض الكل",
    experience_hub: "جرب سويتو هب", visit_store: "قم بزيارة", physical_store: "متجرنا الفعلي",
    store_desc: "تعال واستكشف مجموعتنا التقنية الفاخرة شخصياً. خبراؤنا مستعدون لمساعدتك.",
    our_address: "عنواننا", opening_hours: "ساعات العمل", mon_fri: "الاثنين-الجمعة", saturday: "السبت", sunday: "الأحد", closed: "مغلق",
    get_directions: "احصل على الاتجاهات", call_support: "اتصل بالدعم", about_hub: "عن متجرنا",
    about_desc: "سويتو هب هو وجهتك المحلية للإلكترونيات الممتازة. نحن نربط التكنولوجيا العالمية بالوصول المحلي.",
    explore_categories: "استكشف الفئات", our_location: "موقعنا", physical_address: "العنوان الفعلي",
    service_area: "منطقة الخدمة", nationwide_delivery: "التوصيل الوطني متاح", open_maps: "افتح في خرائط جوجل",
    stay_connected: "ابق على تواصل", subscribe_desc: "اشترك لتلقي التحديثات والعروض الحصرية.",
    enter_email: "أدخل بريدك الإلكتروني...", join_subscribers: "انضم إلى +2500 مشترك",
    privacy: "الخصوصية", terms: "الشروط", security: "الأمان",
    view_all: "عرض الكل", add_to_cart: "أضف إلى السلة", out_of_stock: "غير متوفر",
    your_cart: "سلة التسوق", checkout: "الدفع", total: "المجموع", empty_cart: "سلتك فارغة",
    continue_shopping: "مواصلة التسوق", subtotal: "المجموع الفرعي", taxes_calculated: "الضرائب تحسب عند الدفع",
    remove: "إزالة", color: "اللون", size: "الحجم", quantity: "الكمية", description: "الوصف", features: "الميزات", reviews: "المراجعات",
    categories: "الفئات", all_products: "كل المنتجات", daily_deals: "عروض يومية", trending: "شائع", new_arrivals: "وصل حديثاً",
    sort_by: "ترتيب حسب:", name_az: "الاسم (أ-ي)", price_low_high: "السعر: من الأقل للأعلى", price_high_low: "السعر: من الأعلى للأقل", latest_arrivals: "أحدث المنتجات",
    back: "رجوع", discovery: "اكتشاف", deal_of_day: "عرض اليوم", featured_items: "عناصر مميزة",
    search_results: "نتائج البحث", found_matches: "تطابقات مميزة", premium_selection: "مجموعة مميزة من",
    discover_full_range: "اكتشف تشكيلتنا الكاملة", recently_viewed: "شوهدت مؤخراً", tech_history: "سجلك التقني",
    featured: "مميز", shop_now: "تسوق الآن",
    // Hero & Banners
    featured_selection: "مختارات مميزة", explore_now: "استكشف الآن", exclusive_showcase: "عرض حصري",
    starting_at: "يبدأ من", discount: "خصم", active_now: "نشط الآن", view_product: "عرض المنتج",
    claim_offer: "المطالبة بالعرض", video_commercial: "فيديو تجاري", premium_banner: "بصمة مميزة",
    exclusive_tech_deals: "عروض تقنية حصرية", discover_deals: "اكتشف العروض",
    // Products & Cart
    premium_edition: "إصدار مميز", sold: "تم البيع", discover_product: "اكتشف المنتج", buy_now: "اشترِ الآن",
    feedback: "التعليقات", global_intel: "معلومات عالمية", community_rating: "تقييم المجتمع",
    leave_review: "اترك بصمتك", share_experience: "شارك تجربتك...", submit_experience: "إرسال التجربة",
    related: "ذات صلة", you_might_also_like: "قد يعجبك أيضاً", curated_for_you: "مختار خصيصاً لك",
    verified_authentic: "مخزون أصلي موثق", login_now: "سجل الدخول للمتابعة", products: "المنتجات",
    premium_items: "منتجات مميزة", select_gear: "اختر معداتك", local_handling: "معالجة محلية", gratis: "مجاني",
    elite_offer: "عرض النخبة", video_promo: "فيديو ترويجي", explore_all: "استكشف الكل", view_cart: "عرض السلة", checkout_now: "اتمام الطلب",
    // Footer & Misc
    subscriber_join: "انضم إلى المركز", secure_spam_free: "آمن وخالٍ من الرسائل المزعجة",
    welcome_hub: "مرحباً بك في المركز", check_inbox: "تحقق من بريدك الوارد للحصول على عروض حصرية",
    refine_selection: "تصفية الاختيار", all: "الكل",
    // Common Categories
    headphones: "سماعات الرأس", smartphones: "هواتف ذكية", laptops: "أجهزة كمبيوتر محمول",
    external_cases: "علب خارجية", accessories: "إكسسوارات", gaming: "ألعاب", audio: "صوتيات",
    wearables: "أجهزة قابلة للارتداء", appliances: "أجهزة منزلية", networking: "شبكات",
    storage_drives: "محركات التخزين", desktops: "أجهزة مكتبية", components: "مكونات",
    // Custom Section & Category Labels
    featured_gear: "معدات مميزة", handpicked_products_for_you: "منتجات مختارة لك",
    external_case_hdd: "حافظة هارد خارجي", memory_ram: "ذاكرة رام", earbuds: "سماعات أذن",
    remote: "جهاز تحكم", fan: "مروحة", speakers: "مكبرات صوت", refrigerators: "ثلاجات",
    home_cinema: "سينما منزلية", tv_video: "تلفزيون وفيديو", smart_watch: "ساعة ذكية",
    power_bank: "بنك طاقة", cables: "كابلات", printers: "طابعات",
    // Section Subtitle Phrases
    most_popular_on_our_network: "الأكثر شعبية في شبكتنا",
    the_latest_in: "آخر ما وصل في", popular_choices_in: "الخيارات الشائعة في", the_best_of: "الأفضل من",
    trending_now: "رائج الآن", new_arrival: "وصل حديثاً", just_in: "وصل للتو",
    top_picks_for_you: "أفضل اختياراتنا لك",
    // Wishlist & Checkout
    wishlist_empty: "قائمة أمنياتك فارغة", wishlist_empty_desc: "مجموعتك المنسقة في الانتظار. استكشف مخزوننا المتميز واحفظ مفضلاتك هنا.",
    explore_products: "بدء الاستكشاف", saved_gear: "المعدات المحفوظة", item: "عنصر", items: "عناصر",
    ready_checkout: "جاهز للدفع", curation_status: "حالة التنسيق"
  },
  zh: {
    home: "首页", store_tab: "商店", saved: "已保存", profile: "资料", me: "我", cart: "购物车",
    my_orders: "我的订单", settings: "设置", member_since: "成员自", security: "安全", wishlist: "心愿单", hello: "你好",
    search_placeholder: "搜索高级商品...", welcome: "欢迎", sign_in: "登录", account: "账户",
    recent_arrivals: "最新到达", new: "新", just_arrived: "刚刚到达！", view_all_new: "查看全部",
    experience_hub: "体验 Sweeto Hub", visit_store: "访问我们的", physical_store: "实体店",
    store_desc: "亲自来探索我们的高级科技系列。我们的专家随时准备提供帮助。",
    our_address: "我们的地址", opening_hours: "营业时间", mon_fri: "周一至周五", saturday: "星期六", sunday: "星期日", closed: "关闭",
    get_directions: "获取路线", call_support: "致电支持", about_hub: "关于我们",
    about_desc: "SWEETO-HUB 是您购买高级电子产品的本地首选。我们将全球技术与本地服务相结合。",
    explore_categories: "探索分类", our_location: "我们的位置", physical_address: "实体地址",
    service_area: "服务区域", nationwide_delivery: "全国配送中", open_maps: "在谷歌地图中打开",
    stay_connected: "保持联系", subscribe_desc: "订阅以获取最新产品和独家优惠。",
    enter_email: "输入您的电子邮件...", join_subscribers: "加入 2500+ 订阅者",
    privacy: "隐私", terms: "条款", security: "安全",
    view_all: "查看全部", add_to_cart: "加入购物车", out_of_stock: "缺货",
    your_cart: "您的购物车", checkout: "结账", total: "总计", empty_cart: "您的购物车是空的",
    continue_shopping: "继续购物", subtotal: "小计", taxes_calculated: "税费在结账时计算",
    remove: "移除", color: "颜色", size: "尺寸", quantity: "数量", description: "描述", features: "功能", reviews: "评论",
    categories: "分类", all_products: "所有产品", daily_deals: "每日特价", trending: "热门", new_arrivals: "新品",
    sort_by: "排序方式:", name_az: "名称 (A-Z)", price_low_high: "价格: 从低到高", price_high_low: "价格: 从高到低", latest_arrivals: "最新到达",
    back: "返回", discovery: "发现", deal_of_day: "今日特价", featured_items: "精选商品",
    search_results: "搜索结果", found_matches: "找到高级匹配", premium_selection: "精选",
    discover_full_range: "探索全系列", recently_viewed: "最近浏览", tech_history: "您的科技历史",
    featured: "精选", shop_now: "立即购买",
    // Hero & Banners
    featured_selection: "精选推荐", explore_now: "立即探索", exclusive_showcase: "独家展示",
    starting_at: "起价", discount: "折扣", active_now: "现正进行", view_product: "查看产品",
    claim_offer: "领取优惠", video_commercial: "视频广告", premium_banner: "高级横幅",
    exclusive_tech_deals: "独家科技优惠", discover_deals: "发现优惠",
    // Products & Cart
    premium_edition: "高级版", sold: "已售", discover_product: "发现产品", buy_now: "立即购买",
    feedback: "反馈", global_intel: "全球资讯", community_rating: "社区评分",
    leave_review: "留下您的评价", share_experience: "分享您的体验...", submit_experience: "提交体验",
    related: "相关产品", you_might_also_like: "猜你喜欢", curated_for_you: "为你精选",
    verified_authentic: "验证正品库存", login_now: "登录以继续", products: "产品",
    premium_items: "高级项目", select_gear: "选择你的装备", local_handling: "本地处理", gratis: "免费",
    elite_offer: "精英优惠", video_promo: "视频推广", explore_all: "探索全部", view_cart: "查看购物车", checkout_now: "立即结账",
    // Footer & Misc
    subscriber_join: "加入中心", secure_spam_free: "安全且无垃圾邮件",
    welcome_hub: "欢迎来到中心", check_inbox: "查看收件箱获取独家优惠",
    refine_selection: "精选过滤", all: "全部",
    // Product Dictionary
    premium_noise_cancelling_headphones: "高级降噪耳机",
    pro_gaming_mouse: "专业游戏鼠标",
    ergonomic_mechanical_keyboard: "人体工学机械键盘",
    ultra_slim_laptop: "超薄笔记本",
    smart_home_hub: "智能家居控制中心",
    // Custom Section & Category Labels
    headphones: "耳机", smartphones: "智能手机", laptops: "笔记本电脑",
    external_cases: "外部机箱", accessories: "配件", gaming: "游戏", audio: "音频",
    wearables: "可穿戴设备", appliances: "家用电器", networking: "网络",
    featured_gear: "精选装备", handpicked_products_for_you: "为您精选产品",
    external_case_hdd: "外置硬盘盒", memory_ram: "内存条", earbuds: "耳塞",
    remote: "遥控器", fan: "风扇", speakers: "扬声器", refrigerators: "冰箱",
    home_cinema: "家庭影院", tv_video: "电视与视频", smart_watch: "智能手表",
    power_bank: "充电宝", cables: "数据线", printers: "打印机",
    // Section Subtitle Phrases
    most_popular_on_our_network: "我们网络上最受欢迎的",
    the_latest_in: "最新的", popular_choices_in: "热门选择", the_best_of: "最优秀的",
    trending_now: "当前热门", new_arrival: "新品到货", just_in: "刚刚到货",
    top_picks_for_you: "为您精选推荐",
    // Wishlist & Checkout
    wishlist_empty: "您的心愿单是空的", wishlist_empty_desc: "您的专属精选集合正在等待中。探索我们的高级库存并在此保存您的最爱。",
    explore_products: "开始发现", saved_gear: "已保存的装备", item: "件商品", items: "件商品",
    ready_checkout: "准备结账", curation_status: "策划状态"
  },
  ja: {
    home: "ホーム", store_tab: "ストア", saved: "保存", profile: "プロフ", me: "私", cart: "カート",
    my_orders: "注文履歴", settings: "設定", member_since: "メンバー登録", security: "セキュリティ", wishlist: "お気に入り", hello: "こんにちは",
    search_placeholder: "検索...", welcome: "ようこそ", sign_in: "ログイン", account: "アカウント",
    recent_arrivals: "新着情報", new: "新着", just_arrived: "到着したばかり！", view_all_new: "すべて見る",
    experience_hub: "Sweeto Hubを体験", visit_store: "私たちの", physical_store: "実店舗を訪問",
    store_desc: "プレミアムなテクノロジーコレクションを直接ご覧ください。専門家がお手伝いします。",
    our_address: "住所", opening_hours: "営業時間", mon_fri: "月-金", saturday: "土曜日", sunday: "日曜日", closed: "休業",
    get_directions: "道順", call_support: "サポートに電話", about_hub: "私たちについて",
    about_desc: "SWEETO-HUBはプレミアム電子機器のローカルな目的地です。",
    explore_categories: "カテゴリ", our_location: "私たちの場所", physical_address: "実住所",
    service_area: "サービスエリア", nationwide_delivery: "全国配送可能", open_maps: "Googleマップで開く",
    stay_connected: "接続を維持", subscribe_desc: "新着やフラッシュセールの最新情報を受け取るために購読してください。",
    enter_email: "メールアドレスを入力...", join_subscribers: "2500人以上の購読者に参加",
    privacy: "プライバシー", terms: "利用規約", security: "セキュリティ",
    view_all: "すべて見る", add_to_cart: "カートに追加", out_of_stock: "在庫切れ",
    your_cart: "あなたのカート", checkout: "チェックアウト", total: "合計", empty_cart: "カートは空です",
    continue_shopping: "買い物を続ける", subtotal: "小計", taxes_calculated: "税金はレジで計算されます",
    remove: "削除", color: "色", size: "サイズ", quantity: "数量", description: "説明", features: "特徴", reviews: "レビュー",
    categories: "カテゴリ", all_products: "すべての商品", daily_deals: "日替わりセール", trending: "トレンド", new_arrivals: "新着",
    sort_by: "並べ替え:", name_az: "名前 (A-Z)", price_low_high: "価格: 安い順", price_high_low: "価格: 高い順", latest_arrivals: "最新アイテム",
    back: "戻る", discovery: "発見", deal_of_day: "本日のセール", featured_items: "注目のアイテム",
    search_results: "検索結果", found_matches: "プレミアムな一致が見つかりました", premium_selection: "のプレミアムセレクション",
    discover_full_range: "全商品を見る", recently_viewed: "最近見た商品", tech_history: "閲覧履歴",
    featured: "注目", shop_now: "今すぐ購入",
    // Hero & Banners
    featured_selection: "注目のセレクション", explore_now: "今すぐ探索", exclusive_showcase: "独家ショーケース",
    starting_at: "価格", discount: "割引", active_now: "開催中", view_product: "製品を見る",
    claim_offer: "オファーを受け取る", video_commercial: "ビデオコマーシャル", premium_banner: "プレミアムバナー",
    exclusive_tech_deals: "独占テックセール", discover_deals: "セールを発見",
    // Products & Cart
    premium_edition: "プレミアムエディション", sold: "販売済み", discover_product: "製品を発見", buy_now: "今すぐ購入",
    feedback: "フィードバック", global_intel: "グローバル情報", community_rating: "コミュニティ評価",
    leave_review: "評価を残す", share_experience: "体験を共有する...", submit_experience: "送信",
    related: "関連製品", you_might_also_like: "こちらもおすすめ", curated_for_you: "あなたへの厳選",
    verified_authentic: "認証済み在庫", login_now: "ログインして続行", products: "製品",
    premium_items: "プレミアムアイテム", select_gear: "ギアを選択", local_handling: "ローカル対応", gratis: "無料",
    elite_offer: "エリートオファー", video_promo: "ビデオプロモーション", explore_all: "すべて見る", view_cart: "カートを見る", checkout_now: "今すぐチェックアウト",
    // Footer & Misc
    subscriber_join: "ハブに参加する", secure_spam_free: "安全でスパムなし",
    welcome_hub: "ハブへようこそ", check_inbox: "限定オファーのメールを確認してください",
    refine_selection: "選択を絞り込む", all: "すべて",
    // Product Dictionary
    premium_noise_cancelling_headphones: "プレミアムノイズキャンセリングヘッドフォン",
    pro_gaming_mouse: "プロゲーミングマウス",
    ergonomic_mechanical_keyboard: "人間工学に基づいたメカニカルキーボード",
    ultra_slim_laptop: "ウルトラスリムラップトップ",
    smart_home_hub: "スマートホームハブ",
    // Custom Section & Category Labels
    headphones: "ヘッドフォン", smartphones: "スマートフォン", laptops: "ノートパソコン",
    external_cases: "外部ケース", accessories: "アクセサリー", gaming: "ゲーム", audio: "オーディオ",
    wearables: "ウェアラブル", appliances: "家電", networking: "ネットワーク",
    featured_gear: "注目ギア", handpicked_products_for_you: "あなたへのおすすめ",
    external_case_hdd: "外付けHDDケース", memory_ram: "メモリRAM", earbuds: "イヤホン",
    remote: "リモコン", fan: "扇風機", speakers: "スピーカー", refrigerators: "冷蔵庫",
    home_cinema: "ホームシアター", tv_video: "テレビ・映像", smart_watch: "スマートウォッチ",
    power_bank: "モバイルバッテリー", cables: "ケーブル", printers: "プリンター",
    // Section Subtitle Phrases
    most_popular_on_our_network: "私たちのネットワークで最も人気",
    the_latest_in: "最新の", popular_choices_in: "人気の選択肢", the_best_of: "最高の",
    trending_now: "今のトレンド", new_arrival: "新着商品", just_in: "到着したばかり",
    top_picks_for_you: "あなたへのトップ選択",
    // Wishlist & Checkout
    wishlist_empty: "ウィッシュリストは空です", wishlist_empty_desc: "あなたのために厳選されたコレクションが待っています。プレミアムな在庫を探索し、お気に入りをここに保存してください。",
    explore_products: "発見を始める", saved_gear: "保存したギア", item: "アイテム", items: "アイテム",
    ready_checkout: "チェックアウト準備完了", curation_status: "キュレーションステータス"
  },
  hi: {
    home: "होम", store_tab: "स्टोर", saved: "सहेजा गया", profile: "प्रोफ़ाइल", me: "मैं", cart: "कार्ट",
    search_placeholder: "खोजें...", welcome: "स्वागत है", sign_in: "साइन इन", account: "खाता",
    recent_arrivals: "नई आवक", new: "नया", just_arrived: "अभी आया!", view_all_new: "सभी देखें",
    experience_hub: "स्वीटो हब का अनुभव लें", visit_store: "हमारे", physical_store: "स्टोर पर आएं",
    store_desc: "व्यक्तिगत रूप से हमारे प्रीमियम टेक संग्रह का अन्वेषण करें। हमारे विशेषज्ञ सहायता के लिए तैयार हैं।",
    our_address: "हमारा पता", opening_hours: "खुलने का समय", mon_fri: "सोम-शुक्र", saturday: "शनिवार", sunday: "रविवार", closed: "बंद",
    get_directions: "दिशा प्राप्त करें", call_support: "कॉल समर्थन", about_hub: "हमारे हब के बारे में",
    about_desc: "SWEETO-HUB प्रीमियम इलेक्ट्रॉनिक्स के लिए आपका स्थानीय गंतव्य है।",
    explore_categories: "श्रेणियों का अन्वेषण करें", our_location: "हमारा स्थान", physical_address: "भौतिक पता",
    service_area: "सेवा क्षेत्र", nationwide_delivery: "देशव्यापी वितरण सक्रिय", open_maps: "Google मानचित्र में खोलें",
    stay_connected: "जुड़े रहें", subscribe_desc: "नवीनतम उत्पादों और बिक्री पर अपडेट प्राप्त करने के लिए सदस्यता लें।",
    enter_email: "अपना ईमेल दर्ज करें...", join_subscribers: "2500+ ग्राहकों से जुड़ें",
    privacy: "गोपनीयता", terms: "शर्तें", security: "सुरक्षा",
    view_all: "सभी देखें", add_to_cart: "कार्ट में डालें", out_of_stock: "स्टॉक में नहीं",
    your_cart: "आपका कार्ट", checkout: "चेकआउट", total: "कुल", empty_cart: "आपका कार्ट खाली है",
    continue_shopping: "खरीदारी जारी रखें", subtotal: "उप-कुल", taxes_calculated: "चेकआउट पर कर की गणना",
    remove: "हटाएं", color: "रंग", size: "आकार", quantity: "मात्रा", description: "विवरण", विशेषताएं: "विशेषताएं", reviews: "समीक्षा",
    categories: "श्रेणियाँ", all_products: "सभी उत्पाद", daily_deals: "दैनिक सौदे", trending: "रुझान", new_arrivals: "नया आगमन",
    sort_by: "क्रमबद्ध करें:", name_az: "नाम (A-Z)", price_low_high: "कीमत: कम से अधिक", price_high_low: "कीमत: अधिक से कम", latest_arrivals: "नवीनतम आवक",
    back: "वापस", discovery: "खोज", deal_of_day: "दिन का सौदा", featured_items: "विशेष रुप से प्रदर्शित",
    search_results: "खोज परिणाम", found_matches: "प्रीमियम मैच मिले", premium_selection: "प्रीमियम चयन",
    discover_full_range: "हमारी पूरी श्रृंखला की खोज करें", recently_viewed: "हाल ही में देखा गया", tech_history: "आपका टेक इतिहास",
    featured: "विशेष रुप से प्रदर्शित", shop_now: "अभी खरीदें",
    // Hero & Banners
    featured_selection: "चुनिंदा चयन", explore_now: "अभी अन्वेषण करें", exclusive_showcase: "विशेष शोकेस",
    starting_at: "से शुरू", discount: "छूट", active_now: "अभी सक्रिय", view_product: "उत्पाद देखें",
    claim_offer: "ऑफर का लाभ उठाएं", video_commercial: "वीडियो विज्ञापन", premium_banner: "प्रीमियम बैनर",
    exclusive_tech_deals: "विशेष टेक सौदे", discover_deals: "सौदों की खोज करें",
    // Products & Cart
    premium_edition: "प्रीमियम संस्करण", sold: "बिका हुआ", discover_product: "उत्पाद की खोज करें", buy_now: "अभी खरीदें",
    feedback: "फीडबैक", global_intel: "ग्लोबल इंटेलिजेंस", community_rating: "कम्युनिटी रेटिंग",
    leave_review: "अपनी छाप छोड़ें", share_experience: "अपना अनुभव साझा करें...", submit_experience: "अनुभव सबमिट करें",
    related: "संबंधित", you_might_also_like: "आपको यह भी पसंद आ सकता है", curated_for_you: "आपके लिए चुनिंदा",
    verified_authentic: "सत्यापित प्रामाणिक स्टॉक", login_now: "जारी रखने के लिए लॉगिन करें", products: "उत्पाद",
    premium_items: "प्रीमियम आइटम", select_gear: "अपना गियर चुनें", local_handling: "स्थानीय हैंडलिंग", gratis: "मुफ्त",
    elite_offer: "एलीट ऑफर", video_promo: "वीडियो प्रोमो", explore_all: "सभी का अन्वेषण करें", view_cart: "कार्ट देखें", checkout_now: "अभी चेकआउट करें",
    // Footer & Misc
    subscriber_join: "हब से जुड़ें", secure_spam_free: "सुरक्षित और स्पैम-मुक्त",
    welcome_hub: "हब में आपका स्वागत है", check_inbox: "विशेष सौदों के लिए अपना इनबॉक्स देखें",
    refine_selection: "चयन परिष्कृत करें", all: "सभी",
    // Product Dictionary
    premium_noise_cancelling_headphones: "प्रीमियम शोर-रद्द करने वाले हेडफ़ोन",
    pro_gaming_mouse: "प्रो गेमिंग माउस",
    ergonomic_mechanical_keyboard: "एर्गोनोमिक मैकेनिकल कीबोर्ड",
    ultra_slim_laptop: "अल्ट्रा स्लिम लैपटॉप",
    smart_home_hub: "स्मार्ट होम हब",
    // Custom Section & Category Labels
    headphones: "हेडफोन", smartphones: "स्मार्टफोन", laptops: "लैपटॉप",
    external_cases: "बाहरी केस", accessories: "सहायक उपकरण", gaming: "गेमिंग", audio: "ऑडियो",
    wearables: "पहनने योग्य", appliances: "उपकरण", networking: "नेटवर्किंग",
    featured_gear: "विशेष उत्पाद", handpicked_products_for_you: "आपके लिए चुने गए उत्पाद",
    external_case_hdd: "बाहरी HDD केस", memory_ram: "मेमोरी RAM", earbuds: "ईयरबड्स",
    remote: "रिमोट", fan: "पंखा", speakers: "स्पीकर", refrigerators: "रेफ्रिजरेटर",
    home_cinema: "होम सिनेमा", tv_video: "टीवी और वीडियो", smart_watch: "स्मार्ट वॉच",
    power_bank: "पावर बैंक", cables: "केबल", printers: "प्रिंटर",
    // Section Subtitle Phrases
    most_popular_on_our_network: "हमारे नेटवर्क पर सबसे लोकप्रिय",
    the_latest_in: "में नवीनतम", popular_choices_in: "में लोकप्रिय विकल्प", the_best_of: "का सर्वश्रेष्ठ",
    trending_now: "अभी ट्रेंडिंग", new_arrival: "नया आगमन", just_in: "अभी आया",
    top_picks_for_you: "आपके लिए शीर्ष चुनाव",
    // Wishlist & Checkout
    wishlist_empty: "आपकी इच्छा सूची खाली है", wishlist_empty_desc: "आपका क्यूरेटेड संग्रह प्रतीक्षा कर रहा है। हमारी प्रीमियम सूची का अन्वेषण करें और अपने पसंदीदा को यहाँ सहेजें।",
    explore_products: "खोज शुरू करें", saved_gear: "सहेजा गया गियर", item: "आइटम", items: "आइटम",
    ready_checkout: "चेकआउट के लिए तैयार", curation_status: "क्यूरेशन स्थिति"
  },
  ru: {
    home: "Главная", store_tab: "Магазин", saved: "Сохранено", profile: "Профиль", me: "Я", cart: "Корзина",
    search_placeholder: "Поиск...", welcome: "Добро пожаловать", sign_in: "ВОЙТИ", account: "Аккаунт",
    recent_arrivals: "Новые поступления", new: "Новое", just_arrived: "Только что прибыло!", view_all_new: "Смотреть все",
    experience_hub: "Испытайте Sweeto Hub", visit_store: "Посетите Наш", physical_store: "Физический Магазин",
    store_desc: "Приходите и исследуйте нашу премиальную коллекцию лично. Наши эксперты готовы помочь.",
    our_address: "Наш Адрес", opening_hours: "Часы работы", mon_fri: "Пн-Пт", saturday: "Суббота", sunday: "Воскресенье", closed: "Закрыто",
    get_directions: "Маршрут", call_support: "Поддержка", about_hub: "О Нас",
    about_desc: "SWEETO-HUB — ваш местный пункт назначения для премиальной электроники.",
    explore_categories: "Категории", our_location: "Наше Местоположение", physical_address: "Физический адрес",
    service_area: "Зона Обслуживания", nationwide_delivery: "Национальная доставка", open_maps: "Открыть в Google Maps",
    stay_connected: "Оставайтесь на связи", subscribe_desc: "Подпишитесь, чтобы получать обновления о новых поступлениях и распродажах.",
    enter_email: "Введите ваш email...", join_subscribers: "ПРИСОЕДИНЯЙТЕСЬ К 2500+ ПОДПИСЧИКАМ",
    privacy: "Конфиденциальность", terms: "Условия", security: "Безопасность",
    view_all: "Смотреть Все", add_to_cart: "В корзину", out_of_stock: "Нет в наличии",
    your_cart: "Ваша корзина", checkout: "Оформить заказ", total: "Итого", empty_cart: "Ваша корзина пуста",
    continue_shopping: "Продолжить покупки", subtotal: "Подытог", taxes_calculated: "Налоги рассчитываются при оформлении",
    remove: "Удалить", color: "Цвет", size: "Размер", quantity: "Количество", description: "Описание", features: "Особенности", reviews: "Отзывы",
    categories: "Категории", all_products: "Все продукты", daily_deals: "Скидки дня", trending: "В тренде", new_arrivals: "Новинки",
    sort_by: "Сортировать по:", name_az: "Имя (А-Я)", price_low_high: "Цена: по возрастанию", price_high_low: "Цена: по убыванию", latest_arrivals: "Последние",
    back: "Назад", discovery: "Открытие", deal_of_day: "Сделка Дня", featured_items: "Рекомендуемые",
    search_results: "Результаты поиска", found_matches: "Найдены премиум совпадения", premium_selection: "Премиум выбор",
    discover_full_range: "Откройте весь ассортимент", recently_viewed: "Недавно просмотренные", tech_history: "Ваша история",
    featured: "Рекомендуемые", shop_now: "Купить",
    // Hero & Banners
    featured_selection: "Рекомендуемая подборка", explore_now: "Исследовать сейчас", exclusive_showcase: "Эксклюзивная витрина",
    starting_at: "От", discount: "Скидка", active_now: "Активно сейчас", view_product: "Посмотреть продукт",
    claim_offer: "Получить предложение", video_commercial: "Видеореклама", premium_banner: "Премиум-баннер",
    exclusive_tech_deals: "Эксклюзивные тех-предложения", discover_deals: "Открыть предложения",
    // Products & Cart
    premium_edition: "Премиум-издание", sold: "Продано", discover_product: "Открыть продукт", buy_now: "Купить сейчас",
    feedback: "Обратная связь", global_intel: "Глобальная инфо", community_rating: "Рейтинг сообщества",
    leave_review: "Оставьте свой след", share_experience: "Поделитесь опытом...", submit_experience: "Отправить отзыв",
    related: "Связанные товары", you_might_also_like: "Вам также может понравиться", curated_for_you: "Подобрано для вас",
    verified_authentic: "Проверенный подлинный сток", login_now: "Войдите, чтобы продолжить", products: "Продукты",
    premium_items: "Премиум-товары", select_gear: "Выберите снаряжение", local_handling: "Местная обработка", gratis: "БЕСПЛАТНО",
    elite_offer: "Элитное предложение", video_promo: "Видео-промо", explore_all: "Исследовать все", view_cart: "Просмотреть корзину", checkout_now: "Оформить сейчас",
    // Footer & Misc
    subscriber_join: "ПРИСОЕДИНИТЬСЯ К ХАБУ", secure_spam_free: "БЕЗОПАСНО И БЕЗ СПАМА",
    welcome_hub: "Добро пожаловать в Хаб", check_inbox: "Проверьте почту для получения эксклюзивных предложений",
    refine_selection: "Уточнить выбор", all: "Все",
    // Product Dictionary
    premium_noise_cancelling_headphones: "Премиум наушники с шумоподавлением",
    pro_gaming_mouse: "Профессиональная игровая мышь",
    ergonomic_mechanical_keyboard: "Эргономичная механическая клавиатура",
    ultra_slim_laptop: "Ультратонкий ноутбук",
    smart_home_hub: "Хаб для умного дома",
    // Custom Section & Category Labels
    headphones: "Наушники", smartphones: "Смартфоны", laptops: "Ноутбуки",
    external_cases: "Внешние корпуса", accessories: "Аксессуары", gaming: "Игры", audio: "Аудио",
    wearables: "Носимые устройства", appliances: "Бытовая техника", networking: "Сети",
    featured_gear: "Избранное снаряжение", handpicked_products_for_you: "Подобрано для вас",
    external_case_hdd: "Внешний корпус HDD", memory_ram: "Оперативная память", earbuds: "Вкладыши",
    remote: "Пульт", fan: "Вентилятор", speakers: "Колонки", refrigerators: "Холодильники",
    home_cinema: "Домашний кинотеатр", tv_video: "ТВ и Видео", smart_watch: "Умные часы",
    power_bank: "Внешний аккумулятор", cables: "Кабели", printers: "Принтеры",
    // Section Subtitle Phrases
    most_popular_on_our_network: "Самое Популярное в Нашей Сети",
    the_latest_in: "Новинки в", popular_choices_in: "Популярный выбор в", the_best_of: "Лучшее из",
    trending_now: "Сейчас в тренде", new_arrival: "Новое поступление", just_in: "Только что прибыло",
    top_picks_for_you: "Лучший выбор для вас",
    // Wishlist & Checkout
    wishlist_empty: "Ваш список желаний пуст", wishlist_empty_desc: "Ваша кураторская коллекция ждет. Изучите наш премиальный инвентарь и сохраните свои избранные товары здесь.",
    explore_products: "Начать открытие", saved_gear: "Сохраненное снаряжение", item: "Товар", items: "Товаров",
    ready_checkout: "Готово к оформлению", curation_status: "Статус кураторства"
  }
};

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState('fr');

  useEffect(() => {
    const savedLang = localStorage.getItem('sweetohub_lang');
    if (savedLang && translations[savedLang]) {
      setLang(savedLang);
      document.documentElement.lang = savedLang;
    }
  }, []);

  const changeLanguage = (newLang) => {
    if (translations[newLang]) {
      setLang(newLang);
      localStorage.setItem('sweetohub_lang', newLang);
      document.documentElement.lang = newLang;
    }
  };

  const t = (key) => {
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    return translations['fr'][key] || translations['en'][key] || key;
  };

  const cleanProductName = (str) => {
    if (!str) return str;
    let cleaned = str.replace(/_/g, ' ');
    cleaned = cleaned.replace(/[_\s-]+$/, '');
    cleaned = cleaned.replace(/\s+/g, ' ');
    const lower = cleaned.toLowerCase();
    if (lower.startsWith('playstation 5 console') || lower.startsWith('playstation 5 edition')) {
      return lang === 'fr' ? 'PlayStation 5 Édition Standard' : 'PlayStation 5 Standard Edition';
    }
    if (lower.startsWith('desk fan')) {
      return lang === 'fr' ? 'Ventilateur de Bureau' : 'High-Performance Desk Fan';
    }
    
    const acronyms = ['jbl', 'hp', 'lg', 'tv', 'anc', 'ssd', 'ram', 'usb', 'cpu', 'gpu', 'probook', 'fcfa', 'otg', 'hdmi'];
    
    return cleaned.split(' ').map(word => {
      const lowerWord = word.toLowerCase();
      if (acronyms.includes(lowerWord)) {
        return word.toUpperCase();
      }
      if (/^[a-z]+\d+$/i.test(word) || /^\d+$/.test(word)) {
        return word.toUpperCase();
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    }).join(' ');
  };

  const t_smart = (str) => {
    if (!str) return str;
    const key = str.toLowerCase().replace(/ /g, '_');
    if (translations[lang] && translations[lang][key]) {
      return translations[lang][key];
    }
    return cleanProductName(str);
  };

  const isRTL = lang === 'ar';
  const dir = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = lang;
  }, [lang, dir]);

  return (
    <LanguageContext.Provider value={{ lang, changeLanguage, t, t_smart, isRTL, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
