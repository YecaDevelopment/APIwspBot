export enum CurrentStep {
    welcome = "saludo",
    identify = "identificarCliente",
    selectGroup = "seleccionarGrupo",
    selectRequest = "seleccionarSolicitud",
    fillOptions = "llenarCampos",
    returnTkt = "devolverTKT"
}

export class Chat {
    protected readonly _userPhone: string;
    protected readonly _welcome: string;
    protected _email: string;
    protected _optionGroup: number;
    protected _optionRequest: number;
    protected _optionsFields: string[];
    protected _tktNumber: string;
    protected _currentStep: CurrentStep;
    private timeoutId: NodeJS.Timeout; // ID del temporizador

    constructor(welcome: string, userPhone: string) {
        this._welcome = welcome;
        this._userPhone = userPhone;
        this._currentStep = CurrentStep.welcome
        this.startTimer(); // Iniciar el temporizador al crear el chat
    }

    // Iniciar el temporizador con un límite de tiempo
    private startTimer(): void {
        this.timeoutId = setTimeout(() => {
            this.expireChat(); // Llama al método para expirar la conversación
        }, 20 * 60 * 1000); // 20 minutos en milisegundos
    }
    // Restablece el temporizador en caso de actividad
    protected resetTimer(): void {
        clearTimeout(this.timeoutId); // Limpiar el temporizador existente
        this.startTimer(); // Iniciar un nuevo temporizador
    }
    // Función que se llama al expirar el chat
    private expireChat(): void {
        // Lógica para eliminar el chat del mapa
        endChat(this._userPhone);
    }
    // Getters & Setters
    protected get email(): string {
        return this._email;
    }
    protected set email(value: string) {
        this._email = value;
    }
    protected get optionGroup(): number {
        return this._optionGroup;
    }
    protected set optionGroup(value: number) {
        this._optionGroup = value;
    }
    protected get optionRequest(): number {
        return this._optionRequest;
    }
    protected set optionRequest(value: number) {
        this._optionRequest = value;
    }
    protected get optionsFields(): string[] {
        return this._optionsFields;
    }
    protected set optionsFields(value: string) {
        this._optionsFields.push(value);
    }
    protected get tktNumber(): string {
        return this.tktNumber;
    }
    protected set tktNumber(value: string) {
        this._tktNumber = value;
    }
    protected get currentStep(): string {
        return this._currentStep;
    }
    protected set currentStep(value: CurrentStep) {
        this._currentStep = value;
    }

}

// Mapa global para almacenar las sesiones de chat
export const chatSessions: Map<string, Chat> = new Map();

// Función para eliminar una conversación del mapa
export function endChat(userPhone: string): string {
    chatSessions.delete(userPhone);
    return `Chat ${userPhone} deleted.`;
}
// Función para buscar una conversación del mapa
export function findChat(userPhone : string) : Chat | boolean {
    if(chatSessions.has(userPhone)) return chatSessions.get(userPhone)
    return false
}
// Crear un nuevo chat y almacenarlo en el mapa
export function startChat(welcomeMessage: string, userPhone: string): string {
    const newChat = new Chat(welcomeMessage, userPhone);
    chatSessions.set(userPhone, newChat);
    return `Chat ${userPhone} initialized.`
}