/**
 * Agrupación lógica de categorías planas en grupos padre-hijo.
 */
export interface CategoryGroup {
  slug: string;
  name: string;
  children: string[]; // slugs de las subcategorías (coinciden con los de la DB)
}

export const CATEGORY_GROUPS: CategoryGroup[] = [
  {
    slug: "almacenamiento",
    name: "Almacenamiento",
    children: [
      "discos-hdd",
      "discos-ssd",
      "discos-m2",
      "pendrive",
      "memorias-flash",
      "carry-caddy-disk",
      "lectores",
    ],
  },
  {
    slug: "audio",
    name: "Audio",
    children: [
      "auricular-bluetooth",
      "auricular-cableado",
      "auricular-gamer",
      "parlantes",
      "microfonos",
      "conversores-adaptadores-audio",
    ],
  },
  {
    slug: "cables-conectores",
    name: "Cables y Conectores",
    children: [
      "cable-audio",
      "cable-celulares",
      "cable-energia",
      "cable-hardware",
      "cable-video",
      "conectores",
      "conversores-adaptadores-hardware",
      "conversores-adaptadores-imagen",
      "extensores",
      "patch-cord",
      "patch-panel",
      "utp-ftp",
    ],
  },
  {
    slug: "camaras-seguridad",
    name: "Cámaras y Seguridad",
    children: [
      "camaras-cctv",
      "camaras-filmadoras",
      "camaras-ip",
      "alarmas",
      "alarmas-accesorios",
      "control-de-acceso",
      "dvr-nvr",
      "fuentes-seguridad",
      "kit-seguridad",
      "porteria",
    ],
  },
  {
    slug: "componentes",
    name: "Componentes PC",
    children: [
      "monitores-tv",
      "proyectores",
      "sintonizadores",
      "soportes-imagen",
      "balun",
    ],
  },
  {
    slug: "notebooks-pc",
    name: "Notebooks y PC",
    children: [
      "bases-notebook",
      "mini-pc",
      "notebooks",
      "pc",
      "tablets",
      "tableta-grafica",
    ],
  },
  {
    slug: "oficina",
    name: "Oficina",
    children: [
      "herramientas",
      "limpieza-mantenimiento",
      "navajas-cuchillos",
      "oficina",
      "outlet",
      "outlet-varios",
    ],
  },
  {
    slug: "perifericos",
    name: "Periféricos",
    children: [
      "mouse-gamer",
      "mouse-perifericos",
      "pad",
      "teclado-gamer",
      "teclados-perifericos",
      "webcams",
      "microfonos",
    ],
  },
  {
    slug: "redes",
    name: "Redes",
    children: [
      "antenas",
      "puntos-de-acceso",
      "routers",
      "switches",
      "placas-de-red",
      "utp-ftp",
      "patch-cord",
      "patch-panel",
    ],
  },
  {
    slug: "telefonia-celulares",
    name: "Telefonía y Celulares",
    children: [
      "accesorios-telefonia",
      "celulares",
      "centrales-telefonicas",
      "smartwatch",
    ],
  },
  {
    slug: "variado",
    name: "Variado",
    children: [
      "accesorios-computadoras",
      "accesorios-seguridad",
      "electro",
      "fundas-mochilas-bolsos",
      "grabadoras",
      "licencias-servidores",
      "rack",
      "soportes-computadoras",
      "streaming",
      "ventilador-usb",
    ],
  },
];

/**
 * Devuelve el grupo al que pertenece un slug de categoría.
 */
export function getGroupForSlug(slug: string): CategoryGroup | undefined {
  return CATEGORY_GROUPS.find((g) => g.children.includes(slug));
}
