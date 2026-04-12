import { driver } from "driver.js";
import "driver.js/dist/driver.css";

const baseDriverConfig = {
    showProgress: true,
    animate: true,
    allowClose: true,
    doneBtnText: 'Entendido',
    closeBtnText: 'Cerrar',
    nextBtnText: 'Siguiente ->',
    prevBtnText: '<- Anterior',
    popoverClass: 'driver-popover-custom', // para estilos oscuros si hace falta
};

export const startDashboardTour = () => {
    const driverObj = driver({
        ...baseDriverConfig,
        steps: [
            {
                element: '#sidebar-nav',
                popover: {
                    title: 'Navegación Principal',
                    description: 'Desde este menú puedes acceder a todas las herramientas: Enviar una secuencia para analizar, ver tus Trabajos, gestionar Proyectos y consultar a nuestro Asistente.',
                    side: 'right',
                    align: 'start'
                }
            },
            {
                element: '#btn-new-job',
                popover: {
                    title: 'Nuevo Análisis',
                    description: 'Este botón es el punto de entrada para comenzar a analizar proteínas nuevas.',
                    side: 'bottom',
                }
            },
            {
                element: '#projects-list',
                popover: {
                    title: 'Tus Proyectos',
                    description: 'Tus trabajos se agrupan en Proyectos. Puedes invitar a otros a cada proyecto para trabajar juntos.',
                    side: 'top',
                }
            }
        ]
    });
    driverObj.drive();
};

export const startSubmitTour = () => {
    const driverObj = driver({
        ...baseDriverConfig,
        steps: [
            {
                element: '#fasta-input-area',
                popover: {
                    title: 'Secuencia de la proteína',
                    description: 'Pega aquí la secuencia de tu proteína. Es tan sencillo como copiar y pegar el texto.',
                    side: 'right',
                }
            },
            {
                element: '#target-project-select',
                popover: {
                    title: 'Asignar Proyecto',
                    description: 'Organiza tus análisis asignándolos a un proyecto específico para mantener el orden.',
                    side: 'bottom',
                }
            },
            {
                element: '#submit-job-btn',
                popover: {
                    title: 'Iniciar el proceso',
                    description: 'Al dar clic nuestro sistema calculará la forma de la proteína automáticamente.',
                    side: 'top',
                }
            }
        ]
    });
    driverObj.drive();
};

export const startViewerTour = () => {
    const driverObj = driver({
        ...baseDriverConfig,
        steps: [
            {
                element: '#viewer-canvas',
                popover: {
                    title: 'Visor 3D Interactivo',
                    description: 'Aquí tienes tu proteína en 3D. Puedes rotar, hacer zoom y ver mediante colores lo sólida que es cada zona (las zonas azules son más estables).',
                    side: 'left',
                    align: 'start'
                }
            },
            {
                element: '#viewer-tabs',
                popover: {
                    title: 'Datos Fáciles de Entender',
                    description: 'Agrupamos toda la información en pestañas simples: Estructura, Vista 3D y tu Asistente.',
                    side: 'left',
                }
            },
            {
                element: '#viewer-biochem',
                popover: {
                    title: 'Información adicional',
                    description: 'Te mostraremos anotaciones o datos extras relevantes de una manera intuitiva.',
                    side: 'top',
                }
            }
        ]
    });
    driverObj.drive();
};

export const startChatTour = () => {
    const driverObj = driver({
        ...baseDriverConfig,
        steps: [
            {
                element: '#chat-context-area',
                popover: {
                    title: 'Asistente Amigable',
                    description: 'Nuestro asistente ya ha revisado toda la información de tu proteína por ti.',
                    side: 'bottom',
                }
            },
            {
                element: '#chat-input-area',
                popover: {
                    title: 'Conversa con facilidad',
                    description: 'Puedes hacerle cualquier pregunta de forma natural. Te lo explicará de manera muy sencilla.',
                    side: 'top',
                }
            }
        ]
    });
    driverObj.drive();
};

export const startJobsTour = () => {
    const driverObj = driver({
        ...baseDriverConfig,
        steps: [
            {
                element: 'h1',
                popover: {
                    title: 'Mis Trabajos',
                    description: 'Aquí verás el historial de todos tus análisis. Puedes ver cómo van desde aquí.',
                    side: 'bottom',
                }
            },
            {
                element: '#btn-new-job',
                popover: {
                    title: 'Nuevo Análisis',
                    description: 'Siempre puedes lanzar un nuevo análisis desde el botón lateral.',
                    side: 'right',
                }
            }
        ]
    });
    driverObj.drive();
};

export const startProjectsTour = () => {
    const driverObj = driver({
        ...baseDriverConfig,
        steps: [
            {
                element: 'h1',
                popover: {
                    title: 'Proyectos',
                    description: 'Agrupa tus nuevos objetivos en una carpeta compartida invitando a colaboradores.',
                    side: 'bottom',
                }
            },
            {
                element: '#sidebar-nav',
                popover: {
                    title: 'Navegación general',
                    description: 'Regresa al panel general o revisa tareas anteriores rápidamente.',
                    side: 'right',
                }
            }
        ]
    });
    driverObj.drive();
};

export const autoStartTour = (tourName) => {
    const flag = "tour_seen_$tourName";
    if (!localStorage.getItem(flag)) {
        localStorage.setItem(flag, "true");
        if (tourName === 'dashboard') startDashboardTour();
        if (tourName === 'submit') startSubmitTour();
        if (tourName === 'viewer') startViewerTour();
        if (tourName === 'chat') startChatTour();
    }
};
