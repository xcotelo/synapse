package synapse.rest.dtos;

/**
 * Respuesta al persistir una nota en almacenamiento abierto (Markdown en disco).
 */
public class SavedNoteDto {

    private String storageId;
    private String filename;

    public SavedNoteDto() {
    }

    public SavedNoteDto(String storageId, String filename) {
        this.storageId = storageId;
        this.filename = filename;
    }

    public String getStorageId() {
        return storageId;
    }

    public void setStorageId(String storageId) {
        this.storageId = storageId;
    }

    public String getFilename() {
        return filename;
    }

    public void setFilename(String filename) {
        this.filename = filename;
    }
}
