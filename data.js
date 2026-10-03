// La Cabaña Grill menu. Prices and dishes match the printed menu (Main Menu PDF, Oct 2026).
// Breakfast, beer and margaritas are left out on purpose.
const MENU = [
 {
  "id": "bakery-bunuelos",
  "name": "Buñuelos Colombianos",
  "price": 3.5,
  "category": "bakery",
  "desc": "Colombian cheese donuts, fresh and warm.",
  "img": "images/menu/bunuelos.jpg"
 },
 {
  "id": "bakery-pandebonos",
  "name": "Pandebonos",
  "price": 3.5,
  "category": "bakery",
  "desc": "Warm Colombian cheese bread."
 },
 {
  "id": "bakery-empanada",
  "name": "Empanada Colombiana",
  "price": 3.5,
  "category": "bakery",
  "desc": "Crispy corn empanada. Choose chicken, beef or cheese.",
  "img": "images/menu/empanadas.jpg"
 },
 {
  "id": "arepa-choclo-queso",
  "name": "Arepa de Choclo with Cheese",
  "price": 9.99,
  "category": "arepas",
  "desc": "Sweet corn Colombian arepa with cheese. Protein on the side.",
  "img": "images/menu/arepa-choclo.jpg"
 },
 {
  "id": "arepa-queso",
  "name": "Arepa with Cheese",
  "price": 10.99,
  "category": "arepas",
  "desc": "Colombian style arepa with cheese."
 },
 {
  "id": "arepa-carne-asada-queso",
  "name": "Arepa with Carne Asada & Cheese",
  "price": 14.99,
  "category": "arepas",
  "desc": "Colombian style arepa with grilled steak on the side and cheese."
 },
 {
  "id": "arepa-pollo-queso",
  "name": "Arepa with Chicken & Cheese",
  "price": 13.99,
  "category": "arepas",
  "desc": "Colombian style arepa with chicken on the side and cheese."
 },
 {
  "id": "arepita-chorizo",
  "name": "Arepita with Chorizo",
  "price": 9.99,
  "category": "arepas",
  "desc": "Small arepa with Colombian chorizo."
 },
 {
  "id": "arepita-chicharron",
  "name": "Arepita with Chicharrón",
  "price": 9.99,
  "category": "arepas",
  "desc": "Small arepa with crispy pork belly."
 },
 {
  "id": "arepita-morcilla",
  "name": "Arepita with Morcilla",
  "price": 9.99,
  "category": "arepas",
  "desc": "Small arepa with Colombian blood sausage."
 },
 {
  "id": "arepa-rellena-chorizo",
  "name": "Stuffed Arepa with Chorizo & Cheese",
  "price": 12.99,
  "category": "arepas",
  "desc": "Colombian style stuffed arepa."
 },
 {
  "id": "arepa-rellena-pollo",
  "name": "Stuffed Arepa with Shredded Chicken & Cheese",
  "price": 12.99,
  "category": "arepas",
  "desc": "Colombian style stuffed arepa.",
  "img": "images/menu/arepa-pollo-queso.jpg"
 },
 {
  "id": "arepa-rellena-carne",
  "name": "Stuffed Arepa with Shredded Beef & Cheese",
  "price": 12.99,
  "category": "arepas",
  "desc": "Colombian style stuffed arepa.",
  "img": "images/menu/arepa-carne-desmechada.jpg"
 },
 {
  "id": "arepa-rellena-chicharron",
  "name": "Stuffed Arepa with Chicharrón & Cheese",
  "price": 12.99,
  "category": "arepas",
  "desc": "Colombian style stuffed arepa."
 },
 {
  "id": "burger-toston-mega",
  "name": "Tostón Mega Burger",
  "price": 24.99,
  "category": "burgers",
  "desc": "Ground beef, lettuce, tomato, onion, bacon, fried cheese, egg and secret sauce between two tostones. With fries.",
  "img": "images/menu/toston-mega-burger.jpg",
  "badge": "Signature"
 },
 {
  "id": "bacon-double-stack-cheese-burger-free-fries-drink",
  "name": "Bacon Double Stack Cheeseburger",
  "price": 19.99,
  "category": "burgers",
  "desc": "Two juicy beef patties, double cheese, bacon, lettuce, tomato, onions. With fries.",
  "img": "https://lacabanagrill.net/cdn/shop/files/Doublestackbaconcheeseburger.png?v=1753579786"
 },
 {
  "id": "burger-jalapeno",
  "name": "Spicy Jalapeño Burger",
  "price": 16.99,
  "category": "burgers",
  "desc": "Single beef patty, pepperjack cheese, jalapeño peppers, lettuce, tomato, onions, signature burger sauce. With fries."
 },
 {
  "id": "burger-la-cabana",
  "name": "La Cabaña Burger",
  "price": 19.99,
  "category": "burgers",
  "desc": "Ground beef, lettuce, tomato, onion, bacon, fried egg, shredded potatoes, signature burger sauce. With fries.",
  "badge": "Signature"
 },
 {
  "id": "burger-chorizo",
  "name": "Colombian Chorizo Burger",
  "price": 20.99,
  "category": "burgers",
  "desc": "Single beef patty, american cheese, grilled chorizo, lettuce, tomato, onions, shredded potatoes, ketchup, mayo. With fries.",
  "img": "images/menu/chorizo-burger.jpg",
  "badge": "Signature"
 },
 {
  "id": "burger-single-smash",
  "name": "Cheesy Single Smash",
  "price": 11.99,
  "category": "burgers",
  "desc": "Single smashed beef patty, cheese, onions, signature burger sauce. With fries."
 },
 {
  "id": "burger-double-smash",
  "name": "Cheesy Double Smash",
  "price": 16.99,
  "category": "burgers",
  "desc": "Double smashed beef patties, cheese, onions, signature burger sauce. With fries."
 },
 {
  "id": "kids-grilled",
  "name": "Grilled Chicken or Steak (Kids)",
  "price": 14.99,
  "category": "kids",
  "desc": "Kids portion with rice and fries. Includes kids juice. 8 years and under."
 },
 {
  "id": "kids-salchipapas",
  "name": "Kids Salchipapas",
  "price": 12.99,
  "category": "kids",
  "desc": "Includes fries and kids juice. 8 years and under."
 },
 {
  "id": "kids-nuggets",
  "name": "Chicken Nuggets (6)",
  "price": 12.99,
  "category": "kids",
  "desc": "Includes fries and kids juice. 8 years and under.",
  "img": "images/menu/chicken-nuggets.jpg"
 },
 {
  "id": "kids-wings",
  "name": "Kids Chicken Wings (5)",
  "price": 12.99,
  "category": "kids",
  "desc": "Includes fries and kids juice. 8 years and under."
 },
 {
  "id": "sandwich-pan-con-bistec",
  "name": "Pan con Bistec",
  "price": 17.99,
  "category": "sandwiches",
  "desc": "Steak sandwich with lettuce, tomatoes, sautéed onions and mayo. With fries."
 },
 {
  "id": "sandwich-chicken",
  "name": "Chicken Sandwich",
  "price": 16.99,
  "category": "sandwiches",
  "desc": "Chicken breast with lettuce, tomatoes, sautéed onions, mayo. With fries."
 },
 {
  "id": "perro-colombiano",
  "name": "Perro Colombiano",
  "price": 14.99,
  "category": "sandwiches",
  "desc": "Colombian hot dog with sweet homemade pineapple sauce, crispy shredded potatoes, shredded cheese and pink sauce. With fries.",
  "img": "images/menu/perro-colombiano.jpg",
  "badge": "Signature"
 },
 {
  "id": "salad-chicken-caesar",
  "name": "Chicken Caesar",
  "price": 16.99,
  "category": "salads",
  "desc": "Crisp romaine, croutons, tangy caesar dressing, grated parmesan and grilled chicken.",
  "img": "images/menu/chicken-caesar.jpg"
 },
 {
  "id": "salad-steak-caesar",
  "name": "Grilled Steak Caesar",
  "price": 17.99,
  "category": "salads",
  "desc": "Caesar salad topped with juicy grilled steak.",
  "img": "images/menu/steak-caesar.jpg"
 },
 {
  "id": "salad-shrimp-caesar",
  "name": "Sautéed Shrimp Caesar",
  "price": 22.99,
  "category": "salads",
  "desc": "Crisp romaine, croutons, tangy caesar dressing, topped with 7 large sautéed shrimp."
 },
 {
  "id": "app-tostones-hogao",
  "name": "Tostones con Hogao (4)",
  "price": 11.99,
  "category": "appetizers",
  "desc": "Fried green plantains with traditional Colombian sauce.",
  "img": "images/menu/tostones-hogao.jpg"
 },
 {
  "id": "calamari-con-yuca-frita",
  "name": "Fried Calamari with Fried Yuca",
  "price": 16.99,
  "category": "appetizers",
  "desc": "Crispy calamari with fried yuca.",
  "img": "images/menu/calamari.jpg"
 },
 {
  "id": "app-queso-frito",
  "name": "Queso Frito",
  "price": 8.99,
  "category": "appetizers",
  "desc": "Golden fried cheese."
 },
 {
  "id": "app-soup",
  "name": "Chicken Soup or Lentil Soup",
  "price": 9.95,
  "category": "appetizers",
  "desc": "Homemade Colombian soup.",
  "img": "images/menu/sopa.jpg"
 },
 {
  "id": "app-salchipapas",
  "name": "Fully Loaded Salchipapas",
  "price": 16.99,
  "category": "appetizers",
  "desc": "Hot dogs, fries, shredded cheese, corn, shredded potatoes, sauces."
 },
 {
  "id": "bandeja-paisa",
  "name": "Bandeja Paisa",
  "price": 23.99,
  "category": "steak",
  "desc": "Grilled steak, chorizo, chicharrón, fried egg, beans, rice, sweet plantains and arepita.",
  "img": "https://lacabanagrill.net/cdn/shop/files/bandejapaisaedited.png?v=1753664504",
  "badge": "Signature",
  "specialty": true
 },
 {
  "id": "picada-tipica",
  "name": "Picada Típica Colombiana",
  "price": 51.99,
  "category": "steak",
  "desc": "Grilled steak, chicken, chicharrón, chorizo, morcilla, papas criollas, tostones, fried yuca, tomato, arepita, mazorca and salad.",
  "img": "images/menu/picada.jpg",
  "badge": "Signature",
  "specialty": true
 },
 {
  "id": "churrasco-a-la-parrilla",
  "name": "Grilled Churrasco",
  "price": 29.99,
  "category": "steak",
  "desc": "Accompanied with rice, salad and fries.",
  "img": "https://lacabanagrill.net/cdn/shop/files/churrascoedited.png?v=1753668510",
  "specialty": true
 },
 {
  "id": "carne-asada",
  "name": "Carne Asada",
  "price": 22.99,
  "category": "steak",
  "desc": "Grilled steak with rice, beans, salad and french fries.",
  "img": "https://lacabanagrill.net/cdn/shop/files/CarneAsadaWEBSITEresized-24.jpg?v=1753580454",
  "specialty": true
 },
 {
  "id": "bistec-acaballo",
  "name": "Bistec a Caballo",
  "price": 24.99,
  "category": "steak",
  "desc": "Grilled steak topped with salsa criolla and fried egg, with rice, salad and sweet plantains.",
  "img": "https://lacabanagrill.net/cdn/shop/files/bistecacaballoedited_69349b5e-6d21-4492-99f6-c8fc02ca3817.png?v=1753662808",
  "specialty": true
 },
 {
  "id": "higado-criolla",
  "name": "Hígado a la Criolla",
  "price": 20.99,
  "category": "steak",
  "desc": "Liver cooked in traditional Colombian sauce with rice, salad and papa a la criolla."
 },
 {
  "id": "sobrebarriga-criolla",
  "name": "Sobrebarriga a la Criolla",
  "price": 21.99,
  "category": "steak",
  "desc": "Grilled brisket steak in Colombian traditional sauce with rice, salad and papa a la criolla."
 },
 {
  "id": "cazuela-frijol",
  "name": "Cazuela de Frijol",
  "price": 21.99,
  "category": "steak",
  "desc": "Colombian bean stew with chorizo, chicharrón, sweet plantains, hogao, arepitas and rice."
 },
 {
  "id": "lengua-criolla",
  "name": "Lengua a la Criolla",
  "price": 24.99,
  "category": "steak",
  "desc": "Beef tongue with rice, salad and papa a la criolla."
 },
 {
  "id": "milanesa-de-carne",
  "name": "Milanesa de Carne",
  "price": 21.99,
  "category": "steak",
  "desc": "Breaded steak with rice, salad and french fries.",
  "img": "https://lacabanagrill.net/cdn/shop/files/MilanesadeCarneWEBSITEresized-20_grande.jpg?v=1753655230"
 },
 {
  "id": "parrillada-la-cabana",
  "name": "Parrillada Mar y Tierra",
  "price": 99.99,
  "category": "steak",
  "desc": "Full fried mojarra, grilled chicken breast, churrasco, picaña, chorizo, morcilla, fries, rice, beans and salad.",
  "img": "https://lacabanagrill.net/cdn/shop/files/surfandturfedited_grande.png?v=1753662944",
  "badge": "Signature",
  "specialty": true
 },
 {
  "id": "pollo-apanado",
  "name": "Pollo Apanado",
  "price": 20.99,
  "category": "chicken",
  "desc": "Breaded chicken with rice, salad and fries.",
  "img": "images/menu/pollo-apanado.jpg"
 },
 {
  "id": "pollo-criolla",
  "name": "Pollo a la Criolla",
  "price": 21.99,
  "category": "chicken",
  "desc": "Grilled chicken cooked in traditional Colombian sauce with rice, papas a la criolla and salad."
 },
 {
  "id": "pechuga-parrilla",
  "name": "Pechuga a la Parrilla",
  "price": 19.99,
  "category": "chicken",
  "desc": "Grilled chicken breast with rice, beans, salad and fries.",
  "img": "images/menu/pechuga-parrilla.jpg"
 },
 {
  "id": "pollo-con-champinones",
  "name": "Pollo con Champiñones",
  "price": 23.99,
  "category": "chicken",
  "desc": "Chicken with mushrooms, rice and salad.",
  "img": "https://lacabanagrill.net/cdn/shop/files/PolloconChampinonesWEBSITEresized-36_1_grande.jpg?v=1753655327"
 },
 {
  "id": "chicken-waffle",
  "name": "Chicken & Waffles",
  "price": 23.99,
  "category": "chicken",
  "desc": "Homemade waffles with crispy fried chicken topped with powdered sugar.",
  "img": "https://lacabanagrill.net/cdn/shop/files/DFC07DC5-4F7B-49E1-BF1E-6636C089F134_grande.png?v=1753680800"
 },
 {
  "id": "pollo-asado-la-cabana",
  "name": "Pollo Asado Entero (Family Plate)",
  "price": 34.0,
  "category": "roast",
  "desc": "Whole roast chicken, papas saladas, salad, rice and arepitas.",
  "img": "images/menu/pollo-asado.jpg",
  "badge": "Signature"
 },
 {
  "id": "pollo-asado-medio",
  "name": "1/2 Pollo Asado",
  "price": 17.99,
  "category": "roast",
  "desc": "Half roast chicken with rice and beans."
 },
 {
  "id": "pollo-asado-cuarto",
  "name": "1/4 Pollo Asado",
  "price": 15.99,
  "category": "roast",
  "desc": "Quarter roast chicken with rice and salad."
 },
 {
  "id": "mojarra-frita",
  "name": "Mojarra Frita",
  "price": 29.99,
  "category": "seafood",
  "desc": "Whole fried fish with rice, tostones and salad.",
  "img": "https://lacabanagrill.net/cdn/shop/files/mojarraedited_0372a674-00e9-421b-b1a7-d358f5accf1d.png?v=1753663383",
  "badge": "Signature",
  "specialty": true
 },
 {
  "id": "mojarra-criolla",
  "name": "Mojarra Criolla a la Cabaña",
  "price": 31.99,
  "category": "seafood",
  "desc": "Whole mojarra cooked in traditional Colombian sauce with rice, tostones and salad.",
  "badge": "Signature"
 },
 {
  "id": "pescado-a-la-parilla",
  "name": "Pescado a la Parrilla",
  "price": 19.99,
  "category": "seafood",
  "desc": "Grilled fish filet with rice, tostones and salad.",
  "img": "https://lacabanagrill.net/cdn/shop/files/PescadoalaparillaWEBSITEresized_grande.jpg?v=1753656552"
 },
 {
  "id": "jalea-mixta",
  "name": "Jalea Mixta",
  "price": 27.99,
  "category": "seafood",
  "desc": "Crispy fried fish, mixed seafood, purple onions, lime, cilantro.",
  "img": "images/menu/jalea-mixta.jpg",
  "badge": "Signature",
  "specialty": true
 },
 {
  "id": "pescado-a-la-criolla",
  "name": "Pescado a la Criolla",
  "price": 21.99,
  "category": "seafood",
  "desc": "Fish filet cooked in traditional Colombian sauce.",
  "img": "https://lacabanagrill.net/cdn/shop/files/PescadoalacriollaWEBSITEresized-18_grande.jpg?v=1753656729"
 },
 {
  "id": "pescado-apanado",
  "name": "Pescado Apanado",
  "price": 20.99,
  "category": "seafood",
  "desc": "Breaded fish filet with rice, tostones and salad."
 },
 {
  "id": "pescado-en-salsa-de-mariscos",
  "name": "Pescado en Salsa de Mariscos",
  "price": 32.99,
  "category": "seafood",
  "desc": "Fish filet in a mixed seafood sauce with rice, salad and tostones.",
  "img": "https://lacabanagrill.net/cdn/shop/files/pescado_con_salsa_de_marisco_edited_grande.png?v=1753664069",
  "specialty": true
 },
 {
  "id": "salmon",
  "name": "Salmón a la Parrilla",
  "price": 23.99,
  "category": "seafood",
  "desc": "Grilled salmon with rice, tostones and salad.",
  "img": "https://lacabanagrill.net/cdn/shop/files/SalmonalaparillaWEBSITEresized-23_grande.jpg?v=1753655390"
 },
 {
  "id": "cazuela-mariscos",
  "name": "Cazuela de Mariscos La Cabaña",
  "price": 30.99,
  "category": "seafood",
  "desc": "Traditional seafood stew with shrimp, fish, squid, scallops, rice and tostones.",
  "img": "images/menu/cazuela-mariscos.jpg",
  "badge": "Signature",
  "specialty": true
 },
 {
  "id": "camaron-al-ajillo",
  "name": "Camarón al Ajillo",
  "price": 23.99,
  "category": "seafood",
  "desc": "7 shrimp in garlic, wine and butter sauce with rice, salad and tostones.",
  "img": "https://lacabanagrill.net/cdn/shop/files/CamaronalAjilloWEBSITEresized-22.jpg?v=1753656870",
  "specialty": true
 },
 {
  "id": "arroz-con-pollo",
  "name": "Arroz con Pollo",
  "price": 20.99,
  "category": "rice",
  "desc": "Yellow rice with shredded chicken, veggies and a boiled egg, with sweet plantains and fresh salad.",
  "img": "images/menu/arroz-con-pollo.jpg"
 },
 {
  "id": "arroz-paisa",
  "name": "Arroz Paisa",
  "price": 22.99,
  "category": "rice",
  "desc": "Rice with vegetables, chorizo, chicharrón, steak, chicken and corn, with fried sweet plantains, cilantro and a splash of soy sauce.",
  "img": "images/menu/arroz-paisa.jpg",
  "badge": "Signature"
 },
 {
  "id": "arroz-con-camarones",
  "name": "Arroz con Camarones",
  "price": 23.99,
  "category": "rice",
  "desc": "Yellow rice with shrimp and vegetables, with salad and tostones.",
  "img": "https://lacabanagrill.net/cdn/shop/files/arrozconcamaronedited.png?v=1753667469"
 },
 {
  "id": "arroz-a-la-marinera",
  "name": "Arroz con Mariscos",
  "price": 26.99,
  "category": "rice",
  "desc": "Yellow rice with fish, shrimp, scallops, clams, salad and tostones.",
  "img": "images/menu/arroz-mariscos.jpg"
 },
 {
  "id": "cerdo-criolla",
  "name": "Lomo de Cerdo a la Criolla",
  "price": 20.99,
  "category": "pork",
  "desc": "Grilled pork loin in traditional Colombian sauce with papa a la criolla, rice and salad."
 },
 {
  "id": "cerdo-parrilla",
  "name": "Lomo de Cerdo a la Parrilla",
  "price": 19.99,
  "category": "pork",
  "desc": "Grilled pork loin with rice, salad and fries.",
  "img": "images/menu/cerdo-parrilla.jpg"
 },
 {
  "id": "chuleta-empanizada",
  "name": "Chuleta de Cerdo Empanizada",
  "price": 20.99,
  "category": "pork",
  "desc": "Breaded pork chops with rice, salad and fries."
 },
 {
  "id": "chuleta-ahumada",
  "name": "Chuleta de Cerdo Ahumada",
  "price": 21.99,
  "category": "pork",
  "desc": "Smoked pork chops with rice, salad and fries."
 },
 {
  "id": "postre-flan",
  "name": "Caramel Flan",
  "price": 6.99,
  "category": "desserts",
  "desc": "Homemade caramel flan.",
  "img": "images/menu/flan.jpg"
 },
 {
  "id": "postre-churros",
  "name": "Churros (4)",
  "price": 9.99,
  "category": "desserts",
  "desc": "Choose chocolate or caramel dipping sauce.",
  "badge": "Signature"
 },
 {
  "id": "postre-tres-leches",
  "name": "Three Milk Cake",
  "price": 6.99,
  "category": "desserts",
  "desc": "Tres leches."
 },
 {
  "id": "postre-cuatro-leches",
  "name": "Four Milk Cake",
  "price": 6.99,
  "category": "desserts",
  "desc": "Cuatro leches."
 },
 {
  "id": "postre-arroz-con-leche",
  "name": "Arroz con Leche",
  "price": 6.99,
  "category": "desserts",
  "desc": "Colombian rice pudding."
 },
 {
  "id": "drink-soda",
  "name": "Sodas",
  "price": 2.99,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-imported-soda",
  "name": "Imported Sodas",
  "price": 3.75,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-chocolate-milk",
  "name": "Chocolate Milk",
  "price": 4.5,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-milo",
  "name": "Milo Chocolate Milk",
  "price": 4.99,
  "category": "drinks",
  "desc": "",
  "badge": "Signature"
 },
 {
  "id": "drink-milk",
  "name": "Cold or Warm Milk",
  "price": 3.99,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-perrier",
  "name": "Perrier Water",
  "price": 4.0,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-water",
  "name": "Water Bottle",
  "price": 2.5,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-malta",
  "name": "Malta Pony",
  "price": 4.0,
  "category": "drinks",
  "desc": "",
  "badge": "Signature"
 },
 {
  "id": "drink-agua-panela",
  "name": "Agua Panela con Limón",
  "price": 8.99,
  "category": "drinks",
  "desc": "",
  "badge": "Signature"
 },
 {
  "id": "drink-juice-milk",
  "name": "Natural Fruit Juice with Milk",
  "price": 8.99,
  "category": "drinks",
  "desc": "Fresh fruit blended with milk."
 },
 {
  "id": "drink-coconut-lemonade",
  "name": "Coconut Lemonade",
  "price": 9.99,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-cabana-lemonade",
  "name": "La Cabaña Lemonade",
  "price": 8.99,
  "category": "drinks",
  "desc": "Secret La Cabaña recipe.",
  "badge": "Signature"
 },
 {
  "id": "drink-bretana",
  "name": "Bretaña",
  "price": 4.5,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-cafe-con-leche",
  "name": "Café con Leche",
  "price": 3.5,
  "category": "drinks",
  "desc": "",
  "img": "images/menu/cafe.jpg"
 },
 {
  "id": "drink-american-coffee",
  "name": "American Coffee",
  "price": 2.75,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-colada",
  "name": "Cuban Colada",
  "price": 2.5,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-cortadito",
  "name": "Cuban Cortadito",
  "price": 2.5,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-espresso",
  "name": "Espresso",
  "price": 2.5,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-cappuccino",
  "name": "Cappuccino",
  "price": 4.99,
  "category": "drinks",
  "desc": ""
 },
 {
  "id": "drink-tea",
  "name": "Hot Tea",
  "price": 3.0,
  "category": "drinks",
  "desc": ""
 }
];

// Natural fruit juices ($7.99). Kept as their own list: the dish screen offers them as add-ons.
const JUICES = [
 {
  "id": "jugo-de-lulo",
  "name": "Lulo Juice",
  "price": 7.99,
  "category": "juice",
  "desc": "Natural fruit juice, made fresh.",
  "img": "images/juice-lulo.jpg"
 },
 {
  "id": "jugo-de-guanabana",
  "name": "Guanábana Juice",
  "price": 7.99,
  "category": "juice",
  "desc": "Natural fruit juice, made fresh.",
  "img": "images/juice-guanabana.jpg"
 },
 {
  "id": "jugo-de-mango",
  "name": "Mango Juice",
  "price": 7.99,
  "category": "juice",
  "desc": "Natural fruit juice, made fresh.",
  "img": "images/juice-mango.jpg"
 },
 {
  "id": "jugo-de-pina",
  "name": "Piña (Pineapple) Juice",
  "price": 7.99,
  "category": "juice",
  "desc": "Natural fruit juice, made fresh.",
  "img": "images/juice-pina.jpg"
 }
];

// Menu sections. Big plates first (what we want to sell), then the rest; sides near the end. banner = section photo, note = the menu's extras line.
const CATEGORIES = [
 {
  "id": "steak",
  "label": "Meats",
  "es": "Carnes",
  "note": "",
  "banner": ""
 },
 {
  "id": "chicken",
  "label": "Chicken",
  "es": "Pollo",
  "note": "",
  "banner": "images/menu/pollo-apanado.jpg"
 },
 {
  "id": "roast",
  "label": "Roast Chicken",
  "es": "Pollo Asado",
  "note": "You're gonna love our special marinated roast chicken. Extras: arepitas (2) +$4, maduros +$4.99, mazorca +$4, fries +$5.99.",
  "banner": "images/menu/pollo-asado.jpg"
 },
 {
  "id": "seafood",
  "label": "Seafood",
  "es": "Mariscos",
  "note": "",
  "banner": ""
 },
 {
  "id": "rice",
  "label": "Rice",
  "es": "Arroz Mixtos",
  "note": "Extras: 2 fried eggs +$4.99, 2 small arepitas +$4.",
  "banner": "images/menu/arroz-con-pollo.jpg"
 },
 {
  "id": "pork",
  "label": "Pork",
  "es": "Cerdo",
  "note": "",
  "banner": "images/menu/cerdo-parrilla.jpg"
 },
 {
  "id": "appetizers",
  "label": "Appetizers",
  "es": "Entradas",
  "note": "",
  "banner": "images/menu/tostones-hogao.jpg"
 },
 {
  "id": "salads",
  "label": "Salads",
  "es": "Ensaladas",
  "note": "",
  "banner": "images/menu/chicken-caesar.jpg"
 },
 {
  "id": "sandwiches",
  "label": "Sandwiches",
  "es": "",
  "note": "All sandwiches include french fries.",
  "banner": "images/menu/perro-colombiano.jpg"
 },
 {
  "id": "burgers",
  "label": "Burgers",
  "es": "Hamburguesas",
  "note": "All burgers include french fries. Extras: cheese +$2.99, Colombian cheese +$4, bacon or ham +$2.99.",
  "banner": "images/menu/toston-mega-burger.jpg"
 },
 {
  "id": "arepas",
  "label": "Arepas",
  "es": "",
  "note": "Colombian style arepas come with protein on the side. Extras: mozzarella +$2.99, Colombian cheese +$4.",
  "banner": "images/menu/arepa-pollo-queso.jpg"
 },
 {
  "id": "bakery",
  "label": "Bakery",
  "es": "Antojos",
  "note": "",
  "banner": "images/menu/bunuelos.jpg"
 },
 {
  "id": "kids",
  "label": "Kids Menu",
  "es": "Niños",
  "note": "Includes french fries and kids juice. 8 years and under only.",
  "banner": "images/menu/chicken-nuggets.jpg"
 },
 {
  "id": "sides",
  "label": "Sides",
  "es": "Acompañantes",
  "note": "",
  "banner": "images/menu/maduros.jpg"
 },
 {
  "id": "desserts",
  "label": "Desserts",
  "es": "Postres",
  "note": "",
  "banner": "images/menu/flan.jpg"
 },
 {
  "id": "drinks",
  "label": "Drinks",
  "es": "Bebidas",
  "note": "",
  "banner": "images/menu/jugos.jpg"
 }
];

// Sides (Acompañantes). Order on their own, or add to any plate from the dish screen.
const SIDES_MENU = [
 {
  "id": "side-rice",
  "name": "White Rice",
  "price": 4.99,
  "category": "sides",
  "desc": ""
 },
 {
  "id": "side-beans",
  "name": "Red Beans",
  "price": 4.99,
  "category": "sides",
  "desc": ""
 },
 {
  "id": "side-tostones",
  "name": "Tostones",
  "price": 5.99,
  "category": "sides",
  "desc": "Fried green plantain"
 },
 {
  "id": "side-fries",
  "name": "Fries",
  "price": 5.99,
  "category": "sides",
  "desc": ""
 },
 {
  "id": "side-egg",
  "name": "2 Fried Eggs",
  "price": 4.99,
  "category": "sides",
  "desc": ""
 },
 {
  "id": "side-mazorca",
  "name": "Mazorca (3)",
  "price": 4.0,
  "category": "sides",
  "desc": "Corn on the cob"
 },
 {
  "id": "side-salad",
  "name": "Small House Salad",
  "price": 5.99,
  "category": "sides",
  "desc": ""
 },
 {
  "id": "side-maduros",
  "name": "Maduros",
  "price": 4.99,
  "category": "sides",
  "desc": "Fried sweet plantain"
 },
 {
  "id": "side-arepa",
  "name": "Small Arepas (2)",
  "price": 4.0,
  "category": "sides",
  "desc": ""
 },
 {
  "id": "side-cheese",
  "name": "Cheese Portion",
  "price": 4.0,
  "category": "sides",
  "desc": ""
 },
 {
  "id": "side-hogao",
  "name": "Hogao",
  "price": 5.99,
  "category": "sides",
  "desc": "Traditional Colombian tomato and onion sauce"
 }
];
SIDES_MENU.push({"id": "side-empanadas", "name": "Empanada Sampler (3)", "price": 8.99, "category": "appetizers", "desc": "Chicken, beef and cheese crispy Colombian empanadas.", "img": "images/menu/empanadas.jpg"});

// Daily specials from the menu (no set price on the menu, so they're shown for info, not sold in the app)
const DAILY_SPECIALS = [
 {
  "day": "Monday",
  "dia": "Lunes",
  "name": "Sopa de Lentejas",
  "desc": "with carne guisada or carne asada, rice, salad and maduros"
 },
 {
  "day": "Tuesday",
  "dia": "Martes",
  "name": "Arroz con Pollo",
  "desc": "with chicken soup, salad and maduros"
 },
 {
  "day": "Wednesday",
  "dia": "Miércoles",
  "name": "Especial del Chef",
  "desc": "the chef's special of the day"
 },
 {
  "day": "Thursday",
  "dia": "Jueves",
  "name": "Mini Bandeja Paisa",
  "desc": "rice, beans, ground beef, maduros, egg and chicharrón"
 },
 {
  "day": "Friday",
  "dia": "Viernes",
  "name": "Mondongo",
  "desc": "traditional soup with rice, salad and maduros"
 },
 {
  "day": "Saturday",
  "dia": "Sábado",
  "name": "Sancocho",
  "desc": "with rice, salad and arepas"
 }
];

// DRAFTS: dishes we sell but keep hidden from the app for now (remove the id to show it again)
const DRAFT_IDS = ["chicken-waffle"];
for (let i = MENU.length - 1; i >= 0; i--) if (DRAFT_IDS.includes(MENU[i].id)) MENU.splice(i, 1);
// PROMOTIONS: bundle deals shown on top of the home page. Each one is its own item, so the cart charges the deal price.
const PROMOS = [
  { id: "promo-2-mojarras", name: "2 Mojarras Fritas", price: 49.99, was: 59.98, deal: "2 for $49.99", category: "promo",
    desc: "Two whole crispy fried mojarras, Costeña style, each with rice, salad and fried plantains.",
    img: "https://lacabanagrill.net/cdn/shop/files/mojarraedited_0372a674-00e9-421b-b1a7-d358f5accf1d.png?v=1753663383" },
  { id: "promo-2-pollos-apanados", name: "2 Pollos Apanados", price: 34.99, deal: "2 for $34.99", category: "promo",
    desc: "Two golden breaded chicken breasts, each with rice, salad and fries.",
    img: "images/menu/pollo-apanado.jpg" },
  { id: "promo-arepas-rellenas", name: "2 Arepas Rellenas", price: 14.99, was: 19.98, deal: "Buy 1, get 1 half off", category: "promo",
    desc: "Two stuffed arepas with the filling of your choice. The second one is half price.",
    img: "images/arepa-rellena.jpg" }
];
// Promotions hidden for now (kept above, just not shown or sold)
const HIDDEN_PROMOS = ["promo-arepas-rellenas"];
for (let i = PROMOS.length - 1; i >= 0; i--) if (HIDDEN_PROMOS.includes(PROMOS[i].id)) PROMOS.splice(i, 1);
const ALL_ITEMS = MENU.concat(JUICES, SIDES_MENU, PROMOS);
// Members-only free juice + the "Join free" card. Off for now (everyone gets the free juice); set to true to bring it back.
const MEMBER_PERKS = false;
// Free juice / free drink with meals. OFF for now (no free drinks anywhere); set to true to bring it back.
const FREE_JUICE = false;
// Hold-to-talk (voice ordering) buttons. Hidden for now, nothing deleted; set to true to bring them back.
const TALK_ENABLED = false;

const RESTAURANT = {
  name: "La Cabaña Grill",
  address: "6780 Collins Ave, Miami Beach, FL",
  phone: "+17862547968",
  logo: "icons/logo-transparent.png",
  taxRate: 0.079
};

function findItem(id) {
  return ALL_ITEMS.find((i) => i.id === id);
}

function itemsByCategory(categoryId) {
  return ALL_ITEMS.filter((i) => i.category === categoryId);
}
