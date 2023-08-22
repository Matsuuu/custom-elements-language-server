import { CEMCollection } from "../export";

export class CEMUpdatedEvent extends Event {
    constructor(public updatedCEM: CEMCollection) {
        super("cem-updated");
        // Send CEM
    }
} 
