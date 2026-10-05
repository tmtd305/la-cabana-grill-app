// English / Español switch. The choice is saved (lc_lang) and every page translates itself on load.
// Dish names stay as they are; everything else switches. New text (cart, menus drawn later) is caught by an observer.
(function () {
  var ES = {
    "Home": "Inicio", "Menu": "Menú", "Orders": "Pedidos", "Cart": "Carrito", "Account": "Cuenta", "Card": "Tarjeta", "Messages": "Mensajes", "Policies": "Políticas",
    "Authentic Colombian grill, made fresh in Miami Beach.": "Parrilla colombiana auténtica, hecha al momento en Miami Beach.",
    "Colombian parrilla": "Parrilla colombiana", "Order now": "Ordena ya", "Deals": "Ofertas", "Call us": "Llámanos",
    "Fresh from the kitchen": "Recién salido de la cocina", "Made to order, every time.": "Hecho al momento, siempre.",
    "La Cabaña street food": "Comida callejera La Cabaña", "See the menu": "Ver el menú", "Promotions": "Promociones",
    "Ask": "Pregunta", "Dinner time": "Hora de la cena", "Our grill favorites for tonight.": "Nuestros favoritos de la parrilla para esta noche.",
    "Lunch time": "Hora del almuerzo", "Breakfast": "Desayuno", "Picks for you": "Para ti",
    "Loyalty program · Free to join": "Programa de lealtad · Gratis", "Free drink with your meal": "Bebida gratis con tu comida",
    "Join La Cabaña Club. Order a meal, your drink is on us.": "Únete a La Cabaña Club. Pide un plato y la bebida va por nuestra cuenta.",
    "Join": "Unirme", "Open": "Abrir", "Your member card": "Tu tarjeta de miembro",
    "Show it to friends. They get free drinks, you get $1.": "Muéstrala a tus amigos. Ellos reciben bebidas gratis y tú $1.",
    "Meats": "Carnes", "Chicken": "Pollo", "Roast Chicken": "Pollo asado", "Seafood": "Mariscos", "Rice": "Arroces", "Pork": "Cerdo",
    "Appetizers": "Entradas", "Salads": "Ensaladas", "Sandwiches": "Sándwiches", "Burgers": "Hamburguesas", "Bakery": "Panadería",
    "Kids Menu": "Menú infantil", "Sides": "Acompañantes", "Desserts": "Postres", "Drinks": "Bebidas", "Signature": "De la casa",
    "Liver cooked in traditional Colombian sauce with rice, salad and papa a la criolla.": "Hígado en salsa criolla colombiana con arroz, ensalada y papa criolla.",
    "Grilled brisket steak in Colombian traditional sauce with rice, salad and papa a la criolla.": "Sobrebarriga asada en salsa criolla con arroz, ensalada y papa criolla.",
    "Beef tongue with rice, salad and papa a la criolla.": "Lengua de res con arroz, ensalada y papa criolla.",
    "Grilled chicken cooked in traditional Colombian sauce with rice, papas a la criolla and salad.": "Pollo a la parrilla en salsa criolla con arroz, papas criollas y ensalada.",
    "You're gonna love our special marinated roast chicken. Extras: arepitas (2) +$4, maduros +$4.99, mazorca +$4, fries +$5.99.": "Te va a encantar nuestro pollo asado marinado. Extras: arepitas (2) +$4, maduros +$4.99, mazorca +$4, papas fritas +$5.99.",
    "Half roast chicken with rice and beans.": "Medio pollo asado con arroz y fríjoles.",
    "Quarter roast chicken with rice and salad.": "Cuarto de pollo asado con arroz y ensalada.",
    "Whole mojarra cooked in traditional Colombian sauce with rice, tostones and salad.": "Mojarra entera en salsa criolla con arroz, tostones y ensalada.",
    "Breaded fish filet with rice, tostones and salad.": "Filete de pescado apanado con arroz, tostones y ensalada.",
    "Extras: 2 fried eggs +$4.99, 2 small arepitas +$4.": "Extras: 2 huevos fritos +$4.99, 2 arepitas +$4.",
    "Grilled pork loin in traditional Colombian sauce with papa a la criolla, rice and salad.": "Lomo de cerdo asado en salsa criolla con papa criolla, arroz y ensalada.",
    "Breaded pork chops with rice, salad and fries.": "Chuleta de cerdo apanada con arroz, ensalada y papas fritas.",
    "Smoked pork chops with rice, salad and fries.": "Chuleta de cerdo ahumada con arroz, ensalada y papas fritas.",
    "Golden fried cheese.": "Queso frito dorado.",
    "Hot dogs, fries, shredded cheese, corn, shredded potatoes, sauces.": "Salchichas, papas fritas, queso rallado, maíz, papita ripio y salsas.",
    "Crisp romaine, croutons, tangy caesar dressing, topped with 7 large sautéed shrimp.": "Lechuga romana, crutones, aderezo césar y 7 camarones salteados.",
    "All sandwiches include french fries.": "Todos los sándwiches incluyen papas fritas.",
    "Steak sandwich with lettuce, tomatoes, sautéed onions and mayo. With fries.": "Sándwich de bistec con lechuga, tomate, cebolla salteada y mayonesa. Con papas fritas.",
    "Chicken breast with lettuce, tomatoes, sautéed onions, mayo. With fries.": "Pechuga de pollo con lechuga, tomate, cebolla salteada y mayonesa. Con papas fritas.",
    "All burgers include french fries. Extras: cheese +$2.99, Colombian cheese +$4, bacon or ham +$2.99.": "Todas las hamburguesas incluyen papas fritas. Extras: queso +$2.99, queso colombiano +$4, tocineta o jamón +$2.99.",
    "Two juicy beef patties, double cheese, bacon, lettuce, tomato, onions. With fries.": "Dos carnes jugosas, doble queso, tocineta, lechuga, tomate y cebolla. Con papas fritas.",
    "Single beef patty, pepperjack cheese, jalapeño peppers, lettuce, tomato, onions, signature burger sauce. With fries.": "Carne de res, queso pepperjack, jalapeños, lechuga, tomate, cebolla y salsa de la casa. Con papas fritas.",
    "Ground beef, lettuce, tomato, onion, bacon, fried egg, shredded potatoes, signature burger sauce. With fries.": "Carne de res, lechuga, tomate, cebolla, tocineta, huevo frito, papita ripio y salsa de la casa. Con papas fritas.",
    "Single smashed beef patty, cheese, onions, signature burger sauce. With fries.": "Carne smash, queso, cebolla y salsa de la casa. Con papas fritas.",
    "Double smashed beef patties, cheese, onions, signature burger sauce. With fries.": "Doble carne smash, queso, cebolla y salsa de la casa. Con papas fritas.",
    "Colombian style arepas come with protein on the side. Extras: mozzarella +$2.99, Colombian cheese +$4.": "Las arepas colombianas vienen con la proteína aparte. Extras: mozzarella +$2.99, queso colombiano +$4.",
    "Colombian style arepa with cheese.": "Arepa colombiana con queso.",
    "Colombian style arepa with grilled steak on the side and cheese.": "Arepa colombiana con queso y carne asada aparte.",
    "Colombian style arepa with chicken on the side and cheese.": "Arepa colombiana con queso y pollo aparte.",
    "Small arepa with Colombian chorizo.": "Arepita con chorizo colombiano.", "Small arepa with crispy pork belly.": "Arepita con chicharrón.",
    "Small arepa with Colombian blood sausage.": "Arepita con morcilla.", "Colombian style stuffed arepa.": "Arepa rellena colombiana.",
    "Warm Colombian cheese bread.": "Pandebono colombiano calientico.",
    "Includes french fries and kids juice. 8 years and under only.": "Incluye papas fritas y jugo infantil. Solo 8 años o menos.",
    "Kids portion with rice and fries. Includes kids juice. 8 years and under.": "Porción infantil con arroz y papas fritas. Incluye jugo. 8 años o menos.",
    "Includes fries and kids juice. 8 years and under.": "Incluye papas fritas y jugo infantil. 8 años o menos.",
    "Choose chocolate or caramel dipping sauce.": "Con salsa de chocolate o caramelo.", "Tres leches.": "Tres leches.", "Cuatro leches.": "Cuatro leches.",
    "Colombian rice pudding.": "Arroz con leche colombiano.", "Fresh fruit blended with milk.": "Fruta fresca licuada en leche.",
    "Secret La Cabaña recipe.": "Receta secreta de La Cabaña.",
    "Grilled steak, chorizo, chicharrón, fried egg, beans, rice, sweet plantains and arepita.": "Carne asada, chorizo, chicharrón, huevo frito, fríjoles, arroz, maduro y arepita.",
    "Grilled steak, chicken, chicharrón, chorizo, morcilla, papas criollas, tostones, fried yuca, tomato, arepita, mazorca and salad.": "Carne asada, pollo, chicharrón, chorizo, morcilla, papas criollas, tostones, yuca frita, tomate, arepita, mazorca y ensalada.",
    "Accompanied with rice, salad and fries.": "Con arroz, ensalada y papas fritas.",
    "Grilled steak with rice, beans, salad and french fries.": "Carne asada con arroz, fríjoles, ensalada y papas fritas.",
    "Grilled steak topped with salsa criolla and fried egg, with rice, salad and sweet plantains.": "Carne asada con hogao y huevo frito, con arroz, ensalada y maduro.",
    "Colombian bean stew with chorizo, chicharrón, sweet plantains, hogao, arepitas and rice.": "Fríjoles colombianos con chorizo, chicharrón, maduro, hogao, arepitas y arroz.",
    "Breaded steak with rice, salad and french fries.": "Carne apanada con arroz, ensalada y papas fritas.",
    "Full fried mojarra, grilled chicken breast, churrasco, picaña, chorizo, morcilla, fries, rice, beans and salad.": "Mojarra frita entera, pechuga a la parrilla, churrasco, picaña, chorizo, morcilla, papas fritas, arroz, fríjoles y ensalada.",
    "with carne guisada or carne asada, rice, salad and maduros": "con carne guisada o carne asada, arroz, ensalada y maduros",
    "White Rice": "Arroz blanco", "Red Beans": "Fríjoles rojos", "Fries": "Papas fritas", "2 Fried Eggs": "2 huevos fritos", "Small House Salad": "Ensalada pequeña",
    "Small Arepas (2)": "Arepitas (2)", "Cheese Portion": "Porción de queso", "Caramel Flan": "Flan de caramelo", "Three Milk Cake": "Torta tres leches",
    "Four Milk Cake": "Torta cuatro leches", "Lulo Juice": "Jugo de lulo", "Guanábana Juice": "Jugo de guanábana", "Mango Juice": "Jugo de mango",
    "Piña (Pineapple) Juice": "Jugo de piña", "Sodas": "Gaseosas", "Imported Sodas": "Gaseosas importadas", "Chocolate Milk": "Leche con chocolate",
    "Milo Chocolate Milk": "Leche con Milo", "Cold or Warm Milk": "Leche fría o caliente", "Perrier Water": "Agua Perrier", "Water Bottle": "Botella de agua",
    "Natural Fruit Juice with Milk": "Jugo natural en leche", "Coconut Lemonade": "Limonada de coco", "La Cabaña Lemonade": "Limonada La Cabaña",
    "American Coffee": "Café americano", "Hot Tea": "Té caliente", "Chicken Soup or Lentil Soup": "Sopa de pollo o de lentejas",
    "Fried Calamari with Fried Yuca": "Calamares fritos con yuca frita", "Grilled Churrasco": "Churrasco a la parrilla",
    "View Cart": "Ver carrito", "Free Natural Tropical Juice": "Jugo tropical natural gratis",
    "With any Parrilla or Specialty entree today": "Con cualquier parrilla o plato especial hoy", "Miami Offer": "Oferta Miami",
    "All Dishes": "Todos los platos", "Grill Specials": "Especiales de la parrilla", "Qualifies for free juice": "Incluye jugo gratis",
    "Hold to talk": "Mantén para hablar", "Add to Order": "Agregar al pedido", "Add to order": "Agregar al pedido", "Add": "Agregar",
    "No dishes match your search.": "Ningún plato coincide con tu búsqueda.",
    "Your cart": "Tu carrito", "How do you want your food?": "¿Cómo quieres tu comida?", "Pickup": "Para recoger", "Delivery": "Domicilio",
    "Ready in about 15 to 25 min": "Listo en unos 15 a 25 min", "Where should we bring it?": "¿A dónde lo llevamos?",
    "We'll show your delivery fee as soon as we have your address.": "Te mostramos el costo del domicilio en cuanto tengamos tu dirección.",
    "Your info": "Tus datos", "So we can reach you about your order.": "Para contactarte sobre tu pedido.",
    "Text and email me deals from La Cabaña Grill. Reply STOP anytime.": "Envíenme ofertas de La Cabaña Grill por texto y correo. Responde STOP cuando quieras.",
    "Your order": "Tu pedido", "Add more": "Agregar más", "Your cart is empty": "Tu carrito está vacío", "Browse the menu": "Ver el menú",
    "Free juice applied": "Jugo gratis aplicado", "Add a tip for the team": "Deja una propina para el equipo", "Other": "Otra", "Payment": "Pago",
    "or pay with card": "o paga con tarjeta", "Subtotal": "Subtotal", "Free juice": "Jugo gratis", "Tax": "Impuesto", "Tip": "Propina",
    "Total": "Total", "Place order": "Hacer pedido",
    "Live Flame Updates": "Actualizaciones en vivo", "Enable SMS or Push to track grill-to-counter timing.": "Activa SMS o notificaciones para seguir tu pedido.",
    "Enable": "Activar", "Active Order": "Pedido activo", "Past Orders": "Pedidos anteriores", "No active order": "No hay pedido activo",
    "Order from the menu": "Pide del menú", "Order Details": "Detalles del pedido", "Receipt": "Recibo", "Call Grill": "Llamar", "Navigate": "Cómo llegar",
    "Your past orders": "Tus pedidos anteriores", "Your past orders will show up here.": "Tus pedidos anteriores aparecerán aquí.",
    "Order Verification": "Verificación del pedido", "Show this badge at the La Cabaña pickup counter on Collins Ave.": "Muestra esto en el mostrador de La Cabaña en Collins Ave.",
    "Close Pass": "Cerrar", "Kitchen Live Progress": "Cocina en vivo", "Order Received & Queued": "Pedido recibido", "Preparing on Grill": "En la parrilla",
    "Packaged & Ready on Counter": "Listo en el mostrador", "Picked Up & Satisfied": "Recogido",
    "Sign in": "Iniciar sesión", "Join the club": "Únete al club", "Welcome back": "Bienvenido de nuevo",
    "Sign in with your email or phone number.": "Entra con tu correo o tu número de teléfono.", "Email or phone": "Correo o teléfono",
    "Password": "Contraseña", "Forgot password?": "¿Olvidaste tu contraseña?", "Join La Cabaña Club": "Únete a La Cabaña Club",
    "Your account is your loyalty membership. It's free.": "Tu cuenta es tu membresía. Es gratis.",
    "A free drink when you order a meal": "Una bebida gratis cuando pides un plato", "Your own member card": "Tu propia tarjeta de miembro",
    "Friends you bring get free drinks, you get $1": "Tus amigos reciben bebidas gratis y tú ganas $1",
    "Full name": "Nombre completo", "Phone": "Teléfono", "Email": "Correo", "Address": "Dirección",
    "Text me deals and order updates. Msg & data rates may apply. Reply STOP to opt out.": "Envíenme ofertas y avisos de pedidos. Pueden aplicar tarifas. Responde STOP para salir.",
    "Reset your password": "Cambia tu contraseña", "We'll email you a link to make a new one.": "Te enviamos un enlace por correo para crear una nueva.",
    "Send reset link": "Enviar enlace", "Back to sign in": "Volver a iniciar sesión", "Make a new password": "Crea una contraseña nueva",
    "Type it twice.": "Escríbela dos veces.", "New password": "Contraseña nueva", "Again": "Otra vez", "Save password": "Guardar contraseña",
    "Check your email and tap the link to confirm your account. Then you can sign in on any phone.": "Revisa tu correo y toca el enlace para confirmar tu cuenta. Luego puedes entrar desde cualquier teléfono.",
    "MEMBER CARD": "TARJETA DE MIEMBRO", "Your free drink PIN": "Tu PIN de bebida gratis", "Show your waiter": "Muéstralo a tu mesero",
    "Open card": "Abrir tarjeta", "Settings": "Ajustes", "Account and settings": "Cuenta y ajustes", "Sign out": "Cerrar sesión", "‹ Back": "‹ Atrás", "‹ Home": "‹ Inicio",
    "Your info": "Tus datos", "Text me deals and order updates": "Envíenme ofertas y avisos de pedidos", "Save": "Guardar", "Change password": "Cambiar contraseña",
    "Saved": "Guardado", "Password changed.": "Contraseña cambiada.",
    "LOYALTY PROGRAM · FREE TO JOIN": "PROGRAMA DE LEALTAD · GRATIS", "A free drink": "Una bebida gratis", "with your meal.": "con tu comida.",
    "A free drink when you order a meal": "Una bebida gratis cuando pides un plato", "Your own member card on your phone": "Tu tarjeta de miembro en tu teléfono",
    "Share it: friends get free drinks, you get $1 each": "Compártela: tus amigos reciben bebidas gratis y tú $1 por cada uno",
    "Your name": "Tu nombre", "Join the club": "Únete al club",
    "One free drink per member, with the purchase of a meal. Your number is only for your card. No spam.": "Una bebida gratis por miembro, con la compra de un plato. Tu número es solo para tu tarjeta. Sin spam.",
    "No messages yet": "Aún no hay mensajes", "Order updates and messages from La Cabaña will show up here.": "Los avisos y mensajes de La Cabaña aparecerán aquí.",
    "Text us": "Escríbenos", "Notification settings": "Notificaciones", "Deals and order updates": "Ofertas y avisos de pedidos",
    "Specials, new dishes and your order status": "Especiales, platos nuevos y el estado de tu pedido",
    "Ordering": "Pedidos", "Allergies": "Alergias", "Your information": "Tu información", "Changes, cancellations and refunds": "Cambios, cancelaciones y reembolsos",
    "Free drinks": "Bebidas gratis", "on us": "por nuestra cuenta", "YOUR PIN": "TU PIN", "Works one time": "Sirve una sola vez", "Take a screenshot": "Toma una captura de pantalla",
    "Directions": "Cómo llegar", "Scan for free drinks": "Escanea y recibe bebidas gratis", "Send to a friend": "Enviar a un amigo", "Save card to Photos": "Guardar tarjeta en Fotos",
    "Your people": "Tu gente", "How it works": "Cómo funciona", "No one yet. Send your card to a friend.": "Nadie todavía. Envía tu tarjeta a un amigo.",
    "PINs given": "PINs dados", "Came in": "Vinieron", "You earned": "Ganaste", "MEMBER": "MIEMBRO",
    "Search skirt steak, bandeja paisa, juices...": "Busca churrasco, bandeja paisa, jugos...", "Street address": "Dirección", "Apt": "Apto", "City": "Ciudad",
    "Your name": "Tu nombre", "Phone number": "Teléfono", "Gate code or note for the driver (optional)": "Código o nota para el domiciliario (opcional)",
    "you@email.com or (305) 555-0100": "tu@correo.com o (305) 555-0100", "Your password": "Tu contraseña", "At least 6 characters": "Mínimo 6 caracteres",
    "First and last name": "Nombre y apellido", "Search": "Buscar"
  };
  var RX = [
    [/^Today's special · (\w+)$/, function (m) { return "Especial de hoy · " + ({ Monday: "Lunes", Tuesday: "Martes", Wednesday: "Miércoles", Thursday: "Jueves", Friday: "Viernes", Saturday: "Sábado", Sunday: "Domingo" }[m[1]] || m[1]); }],
    [/^Ends in (.+)$/, function (m) { return "Termina en " + m[1]; }],
    [/^(\d+) for (\$[\d.]+)$/, function (m) { return m[1] + " por " + m[2]; }],
    [/^(\d+) Dishes$/, function (m) { return m[1] + " platos"; }],
    [/^(\d+) items?$/, function (m) { return m[1] + (m[1] === "1" ? " producto" : " productos"); }],
    [/^(\d+) Items? Selected$/, function (m) { return m[1] + " seleccionados"; }],
    [/^Estimated Pickup • (\d+) mins left$/, function (m) { return "Recogida estimada • faltan " + m[1] + " min"; }],
    [/^Miami Beach • (.+)$/, function (m) { return "Miami Beach • " + m[1]; }]
  ];
  var lang = "en"; try { lang = localStorage.getItem("lc_lang") || "en"; } catch (e) {}
  function tr(t) {
    var k = t.trim(); if (!k) return null;
    if (ES[k]) return t.replace(k, ES[k]);
    for (var i = 0; i < RX.length; i++) { var m = k.match(RX[i][0]); if (m) return t.replace(k, RX[i][1](m)); }
    return null;
  }
  function walk(root) {
    if (!root || root.nodeType === 3) { if (root) { var v = tr(root.nodeValue); if (v != null && v !== root.nodeValue) root.nodeValue = v; } return; }
    if (root.nodeType !== 1 || /^(SCRIPT|STYLE|TEXTAREA)$/.test(root.tagName) || root.closest && root.closest(".material-symbols-outlined,[data-noi18n]")) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null), n, list = [];
    while ((n = w.nextNode())) list.push(n);
    list.forEach(function (x) { if (x.parentElement && x.parentElement.closest(".material-symbols-outlined,script,style,[data-noi18n]")) return; var v = tr(x.nodeValue); if (v != null && v !== x.nodeValue) x.nodeValue = v; });
    (root.querySelectorAll ? root.querySelectorAll("[placeholder]") : []).forEach(function (el) { var v = ES[el.placeholder]; if (v) el.placeholder = v; });
    if (root.placeholder && ES[root.placeholder]) root.placeholder = ES[root.placeholder];
  }
  function button() {
    if (document.getElementById("lc-lang")) return;
    var css = document.createElement("style");
    css.textContent = "#lc-lang{all:unset;box-sizing:border-box;cursor:pointer;flex-shrink:0;display:inline-flex;align-items:center;gap:5px;height:32px;padding:0 11px;border-radius:999px;border:1px solid rgba(243,99,16,.6);color:#fff;font:800 12.5px Manrope,sans-serif;letter-spacing:.02em;background:rgba(243,99,16,.08)}" +
      "#lc-lang .material-symbols-outlined{font-size:17px;color:#ff8a3d}#lc-lang .ls{display:none}@media (max-width:420px){#lc-lang{padding:0 9px}#lc-lang .lf{display:none}#lc-lang .ls{display:inline}}#lc-lang.float{position:fixed;top:calc(env(safe-area-inset-top,0px) + 12px);right:12px;z-index:60;background:rgba(12,12,12,.85)}";
    document.head.appendChild(css);
    var b = document.createElement("button"); b.id = "lc-lang"; b.type = "button"; b.setAttribute("data-noi18n", "");
    b.setAttribute("aria-label", lang === "es" ? "Switch to English" : "Cambiar a español");
    b.innerHTML = '<span class="material-symbols-outlined">translate</span><span class="lf">' + (lang === "es" ? "English" : "Español") + '</span><span class="ls">' + (lang === "es" ? "EN" : "ES") + '</span>';
    b.onclick = function () { try { localStorage.setItem("lc_lang", lang === "es" ? "en" : "es"); } catch (e) {} location.reload(); };
    // next to the bell / card in the header; pages without a header get a small floating one
    // top right corner of the header (where the profile icon used to be); pages without a header get a small floating one
    var bell = document.querySelector('header button[aria-label="Enable deal notifications"]');
    var host = bell ? bell.parentElement : null;
    if (host) { b.style.marginLeft = "4px"; host.appendChild(b); } else { b.classList.add("float"); document.body.appendChild(b); }
  }
  function start() {
    button();
    if (lang !== "es") return;
    document.documentElement.lang = "es";
    walk(document.body); document.title = ES[document.title] || document.title;
    new MutationObserver(function (ms) { ms.forEach(function (m) { if (m.type === "characterData") walk(m.target); else m.addedNodes.forEach(walk); }); })
      .observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", function () { setTimeout(start, 0); }); else setTimeout(start, 0);
})();
