import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Términos y Condiciones",
  description: "Términos y condiciones de TechnoStore - Tu tienda de tecnología en General Roca, Río Negro. Información legal, políticas de compra y venta.",
};

export default function TerminosPage() {
  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mb-6 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Volver al inicio
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-[var(--foreground)] tracking-tight">
            Términos y Condiciones
          </h1>
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">
            Última actualización: {new Date().toLocaleDateString("es-AR", { year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>

        {/* Table of Contents */}
        <nav className="mb-10 p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface)]">
          <h2 className="text-sm font-semibold text-[var(--foreground)] mb-4">Contenido</h2>
          <ol className="space-y-2 text-sm">
            {[
              "Introducción",
              "Aceptación de los términos",
              "Información de la empresa",
              "Productos y disponibilidad",
              "Precios y métodos de pago",
              "Facturación",
              "Envíos y tiempos de entrega",
              "Cambios y devoluciones",
              "Garantías",
              "Cancelaciones",
              "Uso del sitio",
              "Protección de datos personales",
              "Propiedad intelectual",
              "Limitación de responsabilidad",
              "Promociones y ofertas",
              "Modificaciones",
              "Legislación aplicable",
              "Contacto",
            ].map((item, i) => (
              <li key={i}>
                <a href={`#${item.toLowerCase().replace(/\s+/g, '-').replace(/ñ/g, 'n')}`} className="text-[var(--foreground-muted)] hover:text-[var(--accent)] transition-colors">
                  <span className="text-[var(--accent)] mr-2">{i + 1}.</span>
                  {item}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        {/* Content */}
        <div className="space-y-12">
          {/* 1. Introducción */}
          <section id="introduccion" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">1</span>
              Introducción
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Bienvenido a TechnoStore. Estos Términos y Condiciones regulan la relación contractual 
                entre TechnoStore (&quot;el vendedor&quot;, &quot;nosotros&quot; o &quot;nuestra&quot;) y toda persona física o jurídica 
                que utilice nuestro sitio web para realizar compras de productos de tecnología (&quot;el comprador&quot;, 
                &quot;usted&quot; o &quot;su&quot;).
              </p>
              <p>
                Al navegar, registrarse o realizar cualquier operación comercial a través de nuestro 
                sitio web <strong>www.technostore.com.ar</strong>, usted manifiesta haber leído, comprendido 
                y aceptado plenamente las condiciones aquí establecidas, sin reservas ni objeciones.
              </p>
            </div>
          </section>

          {/* 2. Aceptación de los términos */}
          <section id="aceptacion-de-los-terminos" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">2</span>
              Aceptación de los términos
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                El acceso y uso de este sitio web implica la aceptación expresa y sin reservas de 
                los presentes Términos y Condiciones. Si usted no está de acuerdo con alguno de estos 
                términos, le solicitamos que se abstenga de utilizar el sitio y no realice ninguna compra.
              </p>
              <p>
                TechnoStore se reserva el derecho de modificar, actualizar o reemplazar estos 
                términos en cualquier momento, con o sin previo aviso. Las modificaciones serán 
                efectivas desde su publicación en el sitio. Es su responsabilidad revisar 
                periódicamente esta página.
              </p>
            </div>
          </section>

          {/* 3. Información de la empresa */}
          <section id="informacion-de-la-empresa" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">3</span>
              Información de la empresa
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                <strong>Razón Social:</strong> TechnoStore
              </p>
              <p>
                <strong>CUIT:</strong> XX-XXXXXXXX-X
              </p>
              <p>
                <strong>Dirección:</strong> 9 de Julio 793, General Roca, Río Negro, Argentina
              </p>
              <p>
                <strong>Email de contacto:</strong> ventas.store900@gmail.com
              </p>
              <p>
                <strong>Teléfono:</strong> 2984 13-0230
              </p>
              <p>
                <strong>Horario de atención:</strong> Lunes a Viernes de 9:00 a 13:00 y 17:30 a 20:30 | Sábados de 9:30 a 13:00
              </p>
            </div>
          </section>

          {/* 4. Productos y disponibilidad */}
          <section id="productos-y-disponibilidad" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">4</span>
              Productos y disponibilidad
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Todos los productos exhibidos en nuestro sitio web están sujetos a disponibilidad 
                de stock al momento de realizar la compra. Las fotografías y descripciones son 
                referenciales y pueden variar ligeramente respecto al producto final.
              </p>
              <p>
                TechnoStore se compromete a mostrar productos con precios y disponibilidad 
                actualizados. Sin embargo, pueden existir errores tipográficos o diferencias 
                de stock que afecten la operación. En tales casos, nos comunicaremos con usted 
                para ofrecerle una solución dentro de las 24 horas hábiles.
              </p>
              <p>
                Las ofertas y promociones están sujetas a la disponibilidad del stock indicado 
                y pueden ser modificadas o canceladas sin previo aviso.
              </p>
            </div>
          </section>

          {/* 5. Precios y métodos de pago */}
          <section id="precios-y-metodos-de-pago" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">5</span>
              Precios y métodos de pago
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                <strong>Precios:</strong> Todos los precios exhibidos en el sitio están expresados 
                en Pesos Argentinos (ARS) e incluyen el Impuesto al Valor Agregado (IVA). 
                Los precios pueden ser modificados sin previo aviso. El precio vigente al 
                momento de confirmar la compra será el que se aplique a su orden.
              </p>
              <p>
                <strong>Métodos de pago aceptados:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Tarjetas de crédito y débito (Visa, Mastercard, American Express, Cabal, Naranja)</li>
                <li>Mercado Pago (tarjeta, transferencia bancaria, saldo en cuenta)</li>
                <li>Transferencia bancaria o depósito</li>
                <li>Efectivo únicamente para compras presenciales en local</li>
              </ul>
              <p>
                Las compras con tarjeta están sujetas a validación y aprobación de la entidad 
                bancaria correspondiente. TechnoStore no se responsabiliza por rechazos o 
                demoras en la aprobación de pagos por parte de terceros.
              </p>
            </div>
          </section>

          {/* 6. Facturación */}
          <section id="facturacion" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">6</span>
              Facturación
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Emitimos comprobantes legales (Factura A o B) conforme la normativa vigente de 
                la Administración Federal de Ingresos Públicos (AFIP). El tipo de factura 
                dependerá de los datos fiscales proporcionados por el comprador al momento 
                de la compra.
              </p>
              <p>
                Para solicitar factura A, el comprador debe proporcionar su CUIT, razón social 
                y datos de facturación correctos antes de confirmar la compra. Una vez 
                emitida la factura, no se podrán realizar modificaciones en el tipo de 
                comprobante.
              </p>
              <p>
                Los comprobantes serán enviados al email registrado o estarán disponibles 
                en su cuenta de usuario.
              </p>
            </div>
          </section>

          {/* 7. Envíos y tiempos de entrega */}
          <section id="envios-y-tiempos-de-entrega" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">7</span>
              Envíos y tiempos de entrega
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Realizamos envíos a todo el territorio de la República Argentina a través de 
                empresas de correo y mensajería con las que mantenemos convenios de envío. 
                Los costos y tiempos de envío varían según la ubicación, peso, dimensiones 
                del paquete y opción de servicio seleccionada.
              </p>
              <p>
                <strong>Tiempos estimados de entrega:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Gran Buenos Aires y Capital Federal: 24 a 48 horas hábiles</li>
                <li>Interior del país (ciudades principales): 48 a 72 horas hábiles</li>
                <li>Zonas rurales o de difícil acceso: hasta 7 días hábiles</li>
              </ul>
              <p>
                Los tiempos son estimados y pueden variar por factores externos a TechnoStore. 
                Una vez despachado su pedido, recibirá un código de seguimiento (tracking) 
                al email registrado.
              </p>
              <p>
                Es responsabilidad del comprador verificar la integridad del paquete al 
                momento de la entrega. Si el包装 arrives damaged,拒絶 la entrega y contáctenos 
                inmediatamente.
              </p>
            </div>
          </section>

          {/* 8. Cambios y devoluciones */}
          <section id="cambios-y-devoluciones" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">8</span>
              Cambios y devoluciones
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Conforme a la Ley de Defensa del Consumidor (Ley 24.240) y la Ley de 
                Ventas a Distancia, usted tiene derecho a rescindir la compra dentro de los 
                <strong>10 (diez) días corridos</strong> desde la recepción del producto, 
                sin necesidad de justificar el motivo.
              </p>
              <p>
                <strong>Condiciones para cambios y devoluciones:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>El producto debe estar en su emballage y estado original, sin uso</li>
                <li>Deben incluirse todos los accesorios, manuales y documentación</li>
                <li>No debe haber sido abierto ni activado (en caso de software o electrónicos)</li>
                <li>El producto no debe haber sido personalizado o modificado a pedido</li>
              </ul>
              <p>
                <strong>Productos excluidos:</strong> Por razones de higiene y seguridad, 
                no se aceptan devoluciones de auriculares, teclados, mouse u otros dispositivos 
                que hayan sido abiertos y probados, salvo por defectos de fabricación comprobados.
              </p>
              <p>
                Los costos de envío para cambios o devoluciones son a cargo del comprador, 
                excepto cuando el motivo sea un error imputable a TechnoStore.
              </p>
            </div>
          </section>

          {/* 9. Garantías */}
          <section id="garantias" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">9</span>
              Garantías
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Todos los productos comercializados por TechnoStore cuentan con la garantía 
                oficial del fabricante o importador, la cual varía según la marca y el producto. 
                La garantía cubrir defectos de fabricación y no aplica para:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Daños causados por mal uso, accidentes o negligencia</li>
                <li>Manipulación o modificaciones no autorizadas</li>
                <li>Desgaste natural por uso cotidiano</li>
                <li>Instalación o configuración incorrecta</li>
                <li>Productos dañados por factores externos (sobretensión, humedad, golpes)</li>
              </ul>
              <p>
                Para gestionar un reclamo de garantía, deberá presentar la factura de compra 
                y comunicarse con nosotros a través de nuestros canales de contacto. Los 
                gastos de envío para reclamos de garantía fuera de General Roca son 
                responsabilidad del comprador.
              </p>
            </div>
          </section>

          {/* 10. Cancelaciones */}
          <section id="cancelaciones" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">10</span>
              Cancelaciones
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Usted puede cancelar su orden sin costo alguno mientras el pedido no haya 
                sido despachado. Una vez que el paquete se encuentra en poder del servicio 
                de mensajería, la cancelación no será posible y deberá proceder con la 
                devolución según las condiciones outlined en la sección 8.
              </p>
              <p>
                Los reembolsos por cancelaciones aceptadas serán procesados dentro de los 
                <strong>5 a 10 días hábiles</strong> posteriores a la confirmación, 
                utilizando el mismo medio de pago empleado en la compra.
              </p>
              <p>
                Las compras realizadas con tarjeta de crédito pueden tardar entre 
                30 y 60 días hábiles en reflejarse en su estado de cuenta, dependiendo 
                de la entidad bancaria.
              </p>
            </div>
          </section>

          {/* 11. Uso del sitio */}
          <section id="uso-del-sitio" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">11</span>
              Uso del sitio
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                El usuario se compromete a utilizar el sitio web únicamente para fines lícitos 
                y de conformidad con estos Términos. Queda prohibido:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Utilizar el sitio para actividades fraudulentas o ilegales</li>
                <li>Realizar pedidos con información falsa o de terceros sin autorización</li>
                <li>Intentar acceder de manera no autorizada a sistemas o cuentas</li>
                <li>Introducir virus, malware o cualquier código malicioso</li>
                <li>Realizar ingeniería inversa o extraer contenido protegido</li>
                <li>Utilizar sistemas automatizados (bots, scrapers) sin autorización</li>
              </ul>
              <p>
                TechnoStore se reserva el derecho de suspender o cancelar cuentas de usuarios 
                que incumplan estas condiciones sin previo aviso.
              </p>
            </div>
          </section>

          {/* 12. Protección de datos personales */}
          <section id="proteccion-de-datos-personales" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">12</span>
              Protección de datos personales
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                TechnoStore respects your privacy and complies with the Ley de Protección 
                de Datos Personales (Ley 25.326) y sus modificatorias. Sus datos personales 
                serán tratados con la máxima confidencialidad y seguridad.
              </p>
              <p>
                <strong>Finalidad del tratamiento:</strong> Los datos recopilados (nombre, 
                email, teléfono, dirección, datos de pago) se utilizan exclusivamente 
                para procesar sus compras, emitir comprobantes, gestionar envíos y brindarle 
                atención al cliente.
              </p>
              <p>
                <strong>Compartición de datos:</strong> No compartimos sus datos personales 
                con terceros, excepto cuando sea necesario para el cumplimiento del servicio 
                (empresas de envío, pasarelas de pago) o cuando la ley lo exija.
              </p>
              <p>
                <strong>Sus derechos:</strong> Usted puede ejercer sus derechos de acceso, 
                rectificación, actualización y supresión de sus datos contactándonos a 
                ventas.store900@gmail.com. También puede registrar quejas ante la Agencia 
                de Acceso a la Información Pública.
              </p>
            </div>
          </section>

          {/* 13. Propiedad intelectual */}
          <section id="propiedad-intelectual" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">13</span>
              Propiedad intelectual
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Todo el contenido publicado en este sitio web —incluyendo textos, fotografías, 
                imágenes, logotipos, diseños, nombres comerciales, marcas y código fuente— 
                es propiedad de TechnoStore o de sus respectivos titulares y está protegido 
                por las leyes de propiedad intelectual de la República Argentina y tratados 
                internacionales.
              </p>
              <p>
                Queda estrictamente prohibida la reproducción, distribución, modificación, 
                adaptación, traducción o cualquier tipo de utilización del contenido de 
                este sitio sin la autorización expresa y por escrito de TechnoStore.
              </p>
              <p>
                El usuario podrá descargar contenido exclusivamente para uso personal y 
                no comercial, siempre que mantenga intactos los avisos de derechos de autor 
                y propiedad intelectual.
              </p>
            </div>
          </section>

          {/* 14. Limitación de responsabilidad */}
          <section id="limitacion-de-responsabilidad" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">14</span>
              Limitación de responsabilidad
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                TechnoStore no será responsable por daños directos, indirectos, incidentales, 
                especiales o emergentes derivados del uso o la imposibilidad de uso del sitio 
                web, incluyendo pero no limitado a pérdidas de datos, interrupción del 
                negocio, gastos de recuperación o cualquier otro perjuicio.
              </p>
              <p>
                TechnoStore no garantiza que el sitio web esté libre de errores, virus o 
                elementos dañinos. El usuario accede al sitio bajo su propia responsabilidad.
              </p>
              <p>
                La responsabilidad máxima de TechnoStore frente a cualquier reclamo no 
                excederá, en ningún caso, el monto total pagado por el usuario por el 
                producto o servicio objeto del reclamo.
              </p>
            </div>
          </section>

          {/* 15. Promociones y ofertas */}
          <section id="promociones-y-ofertas" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">15</span>
              Promociones y ofertas
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Las promociones, descuentos y ofertas especiales exhibidas en el sitio tienen 
                validez durante el período indicado o hasta agotar stock. No se aplican 
                de forma retroactiva a compras ya realizadas.
              </p>
              <p>
                Los códigos de descuento deben ingresarse antes de confirmar la compra y 
                no son acumulables con otras promociones salvo que se indique lo contrario.
              </p>
              <p>
                TechnoStore se reserva el derecho de modificar, cancelar o extender 
                promociones sin previo aviso.
              </p>
            </div>
          </section>

          {/* 16. Modificaciones */}
          <section id="modificaciones" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">16</span>
              Modificaciones
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                TechnoStore se reserva el derecho de modificar estos Términos y Condiciones 
                en cualquier momento. Los cambios serán publicados en esta página con la 
                fecha de última actualización actualizada.
              </p>
              <p>
                Es responsabilidad del usuario revisar periódicamente esta página para 
                estar informado sobre cualquier modificación. El uso continuado del 
                sitio después de cualquier modificación constituye la aceptación de 
                los nuevos términos.
              </p>
            </div>
          </section>

          {/* 17. Legislación aplicable */}
          <section id="legislacion-aplicable" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">17</span>
              Legislación aplicable
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Los presentes Términos y Condiciones se rigen e interpretan de acuerdo con 
                las leyes de la República Argentina, en particular:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li>Ley de Defensa del Consumidor (Ley 24.240) y modificatorias</li>
                <li>Ley de Protección de Datos Personales (Ley 25.326)</li>
                <li>Ley de Ventas a Distancia (Ley 27.250)</li>
                <li>Código Civil y Comercial de la Nación</li>
                <li>Ley de Comercio Electrónico y comunicaciones comerciales</li>
              </ul>
              <p>
                Cualquier controversia derivada de la interpretación o ejecución de estos 
                términos será competencia exclusiva de los tribunales ordinarios de la 
                Ciudad de General Roca, Provincia de Río Negro, con expresa renuncia 
                a cualquier otro fuero o jurisdicción que pudiera corresponder.
              </p>
            </div>
          </section>

          {/* 18. Contacto */}
          <section id="contacto" className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-[var(--foreground)] mb-4 flex items-center gap-3">
              <span className="flex items-center justify-center w-8 h-8 rounded-full bg-[var(--accent)] text-zinc-900 text-sm font-bold">18</span>
              Contacto
            </h2>
            <div className="prose-content text-[var(--foreground-muted)] space-y-3">
              <p>
                Para cualquier consulta, reclamo o sugerencia relacionada con estos 
                Términos y Condiciones, puede contactarnos a través de los siguientes 
                canales:
              </p>
              <ul className="list-disc list-inside space-y-1 pl-4">
                <li><strong>Email:</strong> ventas.store900@gmail.com</li>
                <li><strong>Teléfono / WhatsApp:</strong> 2984 13-0230</li>
                <li><strong>Dirección:</strong> 9 de Julio 793, General Roca, Río Negro, Argentina</li>
                <li><strong>Horario:</strong> Lunes a Viernes 9:00-13:00 y 17:30-20:30 | Sábados 9:30-13:00</li>
              </ul>
              <p>
                Responderemos su consulta dentro de las 24 a 48 horas hábiles.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}