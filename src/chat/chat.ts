export enum CurrentStep {
    welcome = "saludo",
    identify = "identificarCliente",
    selectGroup = "seleccionarGrupo",
    selectRequest = "seleccionarSolicitud",
    fillOptions = "llenarCampos",
    returnTkt = "devolverTKT"
}

export class Chat {
    readonly _userPhone: string;
    readonly _welcome: string;
    readonly _projectId: number;
    readonly _projectIdSDA: number;
    _email: string;
    _accountId: string;
    _optionGroup: number;
    _optionRequest: number;
    _issueTypeId: number;
    _optionsFields: string[];
    _countOptionsFields: number;
    _tktNumber: string;
    _currentStep: CurrentStep;
    private timeoutId: NodeJS.Timeout; // ID del temporizador

    constructor(welcome: string, userPhone: string, projectId: number, projectIdSDA: number) {
        this._welcome = welcome;
        this._userPhone = userPhone;
        this._projectId = projectId;
        this._projectIdSDA = projectIdSDA;
        this._countOptionsFields = 0;
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
    get userPhone(): string {
        return this.userPhone;
    }
    get welcome(): string {
        return this.welcome;
    }
    get projectId(): number {
        return this._projectId;
    }
    get projectIdSDA(): number {
        return this._projectIdSDA;
    }

    get getEmail(): string {
        return this._email;
    }
    set email(value: string) {
        this._email = value;
    }
    get getAccountId(): string {
        return this._accountId;
    }
    set accountId(value: string) {
        this._accountId = value;
    }
    get getOptionGroup(): number {
        return this._optionGroup;
    }
    set optionGroup(value: number) {
        this._optionGroup = value;
    }
    get getOptionRequest(): number {
        return this._optionRequest;
    }
    set optionRequest(value: number) {
        this._optionRequest = value;
    }
    get getIssueTypeId(): number {
        return this._issueTypeId;
    }
    set issueTypeId(value: number) {
        this._issueTypeId = value;
    }
    get getOptionsFields(): string[] {
        return this._optionsFields;
    }
    set optionsFields(value: string[]) {
        this._optionsFields = value;
    }
    get getCountOptionsFields(): number {
        return this._countOptionsFields;
    }
    set countOptionsFields( value : number) {
        this._countOptionsFields++;
    }
    get getTktNumber(): string {
        return this.tktNumber;
    }
    set tktNumber(value: string) {
        this._tktNumber = value;
    }
    get getCurrentStep(): string {
        return this._currentStep;
    }
    set currentStep(value: CurrentStep) {
        this._currentStep = value;
    }
}

// Mapa global para almacenar las sesiones de chat
export const chatSessions: Map<string, Chat> = new Map();

// Función para eliminar una conversación del mapa
export function endChat(userPhone: string): string {
    const  isDeleted = chatSessions.delete(userPhone);
    return `Delete chat ${userPhone}: ${isDeleted}.`;
}
// Función para buscar una conversación del mapa
export function findChat(userPhone : string) : Chat | boolean {
    if(chatSessions.has(userPhone)) return chatSessions.get(userPhone)
    return false
}
// Función para traer todas las conversaciones del mapa
export function findAllChat() {
    return `Conversaciones en curso: ${chatSessions.size}.`
}
// Crear un nuevo chat y almacenarlo en el mapa
export function startChat(welcomeMessage: string, userPhone: string, projectId: number, projectIdSDA: number): string {
    const newChat = new Chat(welcomeMessage, userPhone, projectId, projectIdSDA);
    chatSessions.set(userPhone, newChat);
    return `Chat ${userPhone} initialized.`
}