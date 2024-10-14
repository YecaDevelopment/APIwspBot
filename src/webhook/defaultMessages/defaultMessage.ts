
export function sendMessage(message : string) : string {

    let result : string | []
    if(message.toLowerCase() === 'hola')result = message.toLowerCase().trim()
    if( message.toLowerCase().endsWith('_eden') || 
        message.toLowerCase().endsWith('_edesa') ||
        message.toLowerCase().endsWith('_edes') || 
        message.toLowerCase().endsWith('_edelap') || 
        message.toLowerCase().endsWith('_edea') || 
        message.toLowerCase().endsWith('_desa'))result = 'nombre_apellido_distribuidora'
    if(message.toLowerCase() === 'opcion' || message.toLowerCase() === 'opción') result = 'opcion'
    if(message.toLowerCase().startsWith('problema:')) result = 'problema'

    switch(result){
        case 'hola':
            return "Hola! Soy el agente virtual de la mesa de ayuda, te voy acompañar en la generación de un ticket. Voy hacerte unas pocas preguntas para comenzar."+
                    "¿Puedes decirme tu nombre, apellido y distribuidora de la cual te comunicas? Necesito que los escribas de la siguiente manera nombre_apellido_distribuidora, es importante que lo separes sólo con guiones."

        case 'nombre_apellido_distribuidora':
            return "Genial, ahora te comparto una lista de opciones, decime el número de la que represente tu problema.%0A" +
                    "1 . Problemas con la cuenta o inicio de sesión.%0A" +
                    "2 . Problemas con mi equipo de trabajo.%0A" +
                    "3 . Problemas con de red.%0A" +
                    "4 . Problemas con los sistemas de la organización."

        case 'opcion':
            return "Para concluir te voy a solicitar que agregues una breve descripción del problema, el mensaje debe comenzar de la siguiente manera -> problema: Aquí va tu comentario."

        case 'problema': 
            return "Perfecto! Con esta información que me compartis voy a generar el ticket, en breve un técnico tomará tu caso y se pondrá en contacto. Muchas gracias por ponerte en contacto, que tengas un lindo día."

        default: 
            return "No entiendo la opción que elegiste, por favor escribe -> hola <- para iniciar una conversación."

    }



    return 'result'
}