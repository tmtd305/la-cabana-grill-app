// Real menu data sourced from lacabanagrill.net product pages/images.
const MENU = [
  // Steak & Parrilla
  {
    id: "bandeja-paisa",
    name: "Bandeja Paisa",
    price: 22.99,
    category: "steak",
    badge: "House Legend",
    rating: "4.9 (420+)",
    desc: "Carne asada, artisanal crispy chicharrón, sunny-side egg, tender Colombian red beans, white jasmine rice, sweet maduro, avocado slice, and warm white arepa.",
    img: "https://lacabanagrill.net/cdn/shop/files/bandejapaisaedited.png?v=1753664504",
    specialty: true
  },
  {
    id: "churrasco-a-la-parrilla",
    name: "Churrasco a la Parrilla",
    price: 28.99,
    category: "steak",
    badge: "Chef Signature",
    rating: "5.0 (280+)",
    desc: "Fire-grilled center-cut skirt steak topped with freshly chopped house parsley & garlic chimichurri. Served with your selection of two Latin sides.",
    img: "https://lacabanagrill.net/cdn/shop/files/churrascoedited.png?v=1753668510",
    specialty: true
  },
  {
    id: "carne-asada",
    name: "Carne Asada",
    price: 20.99,
    category: "steak",
    desc: "Grilled marinated skirt steak, a La Cabaña classic served with your choice of two sides.",
    img: "https://lacabanagrill.net/cdn/shop/files/CarneAsadaWEBSITEresized-24.jpg?v=1753580454",
    specialty: true
  },
  {
    id: "milanesa-de-carne",
    name: "Milanesa de Carne",
    price: 19.99,
    category: "steak",
    desc: "Breaded and fried thin-cut beef milanesa, crispy outside and tender inside.",
    img: "https://lacabanagrill.net/cdn/shop/files/MilanesadeCarneWEBSITEresized-20_grande.jpg?v=1753655230",
    specialty: false
  },
  {
    id: "bistec-acaballo",
    name: "Bistec A Caballo",
    price: 19.99,
    category: "steak",
    desc: "Grilled steak topped with a fried egg, served with rice and plantains.",
    img: "https://lacabanagrill.net/cdn/shop/files/bistecacaballoedited_69349b5e-6d21-4492-99f6-c8fc02ca3817.png?v=1753662808",
    specialty: false
  },
  {
    id: "parrillada-la-cabana",
    name: "Parrilla Surf & Turf (Feast)",
    price: 119.0,
    category: "steak",
    desc: "Grand table platter: Ribeye, Churrasco, Jumbo shrimp, Chorizo, ribs & 4 sides.",
    img: "https://lacabanagrill.net/cdn/shop/files/surfandturfedited_grande.png?v=1753662944",
    specialty: true
  },
  // Chicken
  {
    id: "pollo-con-champinones",
    name: "Pollo con Champiñones",
    price: 19.99,
    category: "chicken",
    desc: "Grilled chicken breast in a creamy mushroom-white wine reduction.",
    img: "https://lacabanagrill.net/cdn/shop/files/PolloconChampinonesWEBSITEresized-36_1_grande.jpg?v=1753655327",
    specialty: false
  },
  {
    id: "chicken-waffle",
    name: "Chicken & Waffles",
    price: 21.99,
    category: "chicken",
    desc: "Crispy fried chicken over a golden waffle, drizzled with syrup.",
    img: "https://lacabanagrill.net/cdn/shop/files/DFC07DC5-4F7B-49E1-BF1E-6636C089F134_grande.png?v=1753680800",
    specialty: false
  },
  {
    id: "pollo-asado-la-cabana",
    name: "Pollo Asado Entero",
    price: 32.0,
    category: "chicken",
    desc: "Whole family-style roasted chicken, La Cabaña style.",
    img: "https://lacabanagrill.net/cdn/shop/files/Pollo_Asado_Entero_La_Cabana_Family_Plate_WEBSITE_resized_-6_grande.jpg?v=1753656803",
    specialty: false
  },
  // Seafood
  {
    id: "jalea-mixta",
    name: "Jalea Mixta",
    price: 22.99,
    category: "seafood",
    desc: "Golden crispy fried seafood platter with shrimp, calamari, white fish & yuca.",
    img: "https://lacabanagrill.net/cdn/shop/files/2B06607A-B486-451C-828C-CB4B78D2D4F4_grande.png?v=1753666189",
    specialty: true
  },
  {
    id: "mojarra-frita",
    name: "Mojarra Frita Costeña",
    price: 29.99,
    category: "seafood",
    badge: "Cartagena Style",
    rating: "4.8 (140+)",
    desc: "Crisp deep-fried whole red tilapia marinated in sea salt, lime, and garlic. Paired with sweet coconut rice and smashed tostones.",
    img: "https://lacabanagrill.net/cdn/shop/files/mojarraedited_0372a674-00e9-421b-b1a7-d358f5accf1d.png?v=1753663383",
    specialty: true
  },
  {
    id: "pescado-en-salsa-de-mariscos",
    name: "Pescado en Salsa de Mariscos",
    price: 24.99,
    category: "seafood",
    desc: "Fresh fish filet smothered in a rich seafood sauce.",
    img: "https://lacabanagrill.net/cdn/shop/files/pescado_con_salsa_de_marisco_edited_grande.png?v=1753664069",
    specialty: true
  },
  {
    id: "camaron-al-ajillo",
    name: "Camaron al Ajillo",
    price: 21.99,
    category: "seafood",
    desc: "Shrimp sautéed in a garlicky butter sauce.",
    img: "https://lacabanagrill.net/cdn/shop/files/CamaronalAjilloWEBSITEresized-22.jpg?v=1753656870",
    specialty: true
  },
  {
    id: "pescado-a-la-criolla",
    name: "Pescado a la Criolla",
    price: 19.99,
    category: "seafood",
    desc: "Fish filet simmered in a Colombian creole tomato sauce.",
    img: "https://lacabanagrill.net/cdn/shop/files/PescadoalacriollaWEBSITEresized-18_grande.jpg?v=1753656729",
    specialty: true
  },
  {
    id: "pescado-a-la-parilla",
    name: "Pescado a la Parilla",
    price: 19.99,
    category: "seafood",
    desc: "Grilled fresh fish filet with your choice of two sides.",
    img: "https://lacabanagrill.net/cdn/shop/files/PescadoalaparillaWEBSITEresized_grande.jpg?v=1753656552",
    specialty: true
  },
  {
    id: "calamari-con-yuca-frita",
    name: "Calamari con Yuca Frita",
    price: 16.99,
    category: "seafood",
    desc: "Crispy fried calamari served with golden fried yuca.",
    img: "https://lacabanagrill.net/cdn/shop/files/CalamariwithFriedYucaWEBSITEresized-11_grande.jpg?v=1753655679",
    specialty: false
  },
  {
    id: "salmon",
    name: "Salmon",
    price: 31.99,
    category: "seafood",
    desc: "Grilled salmon filet, served with your choice of two sides.",
    img: "https://lacabanagrill.net/cdn/shop/files/SalmonalaparillaWEBSITEresized-23_grande.jpg?v=1753655390",
    specialty: true
  },
  // Rice & Sides
  {
    id: "arroz-a-la-marinera",
    name: "Arroz a la Marinera",
    price: 24.99,
    category: "rice",
    desc: "Colombian-style seafood rice loaded with shrimp and shellfish.",
    img: "https://lacabanagrill.net/cdn/shop/files/ArrozconMariscosWEBSITEresized-15.jpg?v=1753657081",
    specialty: false
  },
  {
    id: "arroz-con-camarones",
    name: "Arroz con Camarones",
    price: 21.99,
    category: "rice",
    desc: "Savory shrimp fried rice, Latin style.",
    img: "https://lacabanagrill.net/cdn/shop/files/arrozconcamaronedited.png?v=1753667469",
    specialty: false
  },
  // Street Food
  {
    id: "bacon-double-stack-cheese-burger-free-fries-drink",
    name: 'Bacon "Double Stack" Cheese Burger',
    price: 18.99,
    category: "streetfood",
    desc: "Double stack bacon cheeseburger, comes with free fries & a drink.",
    img: "https://lacabanagrill.net/cdn/shop/files/Doublestackbaconcheeseburger.png?v=1753579786",
    specialty: false
  }
];

const JUICES = [
  {
    id: "jugo-de-lulo",
    name: "Jugo de Lulo",
    price: 6.5,
    category: "juice",
    tag: "Iconic",
    desc: "Citrusy & tart",
    img: "https://lacabanagrill.net/cdn/shop/files/lulo_juice.png?v=1760974553"
  },
  {
    id: "jugo-de-guanabana",
    name: "Guanábana",
    price: 6.5,
    category: "juice",
    tag: "Creamy",
    desc: "Sweet soursop",
    img: "https://lacabanagrill.net/cdn/shop/files/guanabana_juice.png?v=1760974330"
  },
  {
    id: "jugo-de-mango",
    name: "Mango Fresco",
    price: 6.5,
    category: "juice",
    tag: "Sweet",
    desc: "Ripe tropical",
    img: "https://lacabanagrill.net/cdn/shop/files/mango_juice_b5d0bf51-a7de-4467-b7ff-2a106b4d402c.png?v=1760974023"
  },
  {
    id: "jugo-de-pina",
    name: "Piña Natural",
    price: 6.5,
    category: "juice",
    tag: "Crisp & chilled",
    desc: "Crisp & chilled",
    img: "https://lacabanagrill.net/cdn/shop/files/pineapple_juice_420d89e9-2205-404b-b77a-0942ce2a4b22.png?v=1760974276"
  }
];

const CATEGORIES = [
  { id: "steak", label: "Steak & Parrilla", emoji: "🥩" },
  { id: "chicken", label: "Chicken", emoji: "🍗" },
  { id: "seafood", label: "Seafood", emoji: "🐟" },
  { id: "rice", label: "Rice & Sides", emoji: "🍚" },
  { id: "juice", label: "Natural Juices", emoji: "🍹" },
  { id: "streetfood", label: "Street Food", emoji: "🍔" }
];

const ALL_ITEMS = MENU.concat(JUICES);
const RESTAURANT = {
  name: "La Cabaña Grill",
  address: "743 Washington Ave, Miami Beach, FL",
  logo: "https://lacabanagrill.net/cdn/shop/files/La_cabana_logo_transparent.png?v=1753649726",
  taxRate: 0.079
};

function findItem(id) {
  return ALL_ITEMS.find((i) => i.id === id);
}

function itemsByCategory(categoryId) {
  return ALL_ITEMS.filter((i) => i.category === categoryId);
}
