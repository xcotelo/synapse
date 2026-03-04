package synapse.rest.controllers;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.core.io.Resource;

import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import synapse.rest.dtos.BrainSuggestParamsDto;
import synapse.rest.dtos.BrainSuggestionDto;
import synapse.rest.dtos.BrainLinkPreviewDto;
import synapse.rest.dtos.SaveNoteParamsDto;
import synapse.rest.dtos.SavedNoteDto;

import synapse.rest.dtos.FactCheckParamsDto;
import synapse.rest.dtos.FactCheckResponseDto;
import synapse.rest.dtos.TrendsInsightsParamsDto;
import synapse.rest.dtos.TrendsInsightsResponseDto;
import synapse.model.services.BrainSuggestionService;
import synapse.model.services.LlamaAIService;
import synapse.model.services.MediaStorageService;
import synapse.model.services.NoteMarkdownStorageService;

/**
 * REST controller for the Digital Brain API.
 * Thin controller: delegates all business logic to services.
 * URL naming follows REST conventions (nouns, not verbs).
 */
@RestController
@RequestMapping(value = "/api/brain", produces = MediaType.APPLICATION_JSON_VALUE)
@SuppressWarnings("null")
public class BrainController {
    private static final Logger logger = LoggerFactory.getLogger(BrainController.class);

    private final BrainSuggestionService brainSuggestionService;
    private final LlamaAIService llamaAIService;
    private final MediaStorageService mediaStorageService;
    private final NoteMarkdownStorageService noteMarkdownStorageService;

    @Value("${server.servlet.context-path:}")
    private String contextPath;

    public BrainController(BrainSuggestionService brainSuggestionService,
            LlamaAIService llamaAIService,
            MediaStorageService mediaStorageService,
            NoteMarkdownStorageService noteMarkdownStorageService) {
        this.brainSuggestionService = brainSuggestionService;
        this.llamaAIService = llamaAIService;
        this.mediaStorageService = mediaStorageService;
        this.noteMarkdownStorageService = noteMarkdownStorageService;
    }

    /**
     * POST /api/brain/suggestions — AI content classification.
     */
    @PostMapping("/suggestions")
    @ResponseStatus(HttpStatus.OK)
    public BrainSuggestionDto suggest(@RequestBody BrainSuggestParamsDto params) {
        logger.info("Recibida petición de sugerencia para contenido: {}", params.getContent());
        BrainSuggestionService.SuggestionResult result = brainSuggestionService.suggest(params.getContent());
        return toSuggestionDto(result);
    }

    /**
     * GET /api/brain/previews?url=... — URL preview extraction.
     */
    @GetMapping("/previews")
    @ResponseStatus(HttpStatus.OK)
    public BrainLinkPreviewDto preview(@RequestParam("url") String url) {
        BrainSuggestionService.LinkPreviewResult result = brainSuggestionService.extractLinkPreview(url);
        return new BrainLinkPreviewDto(result.getUrl(), result.getType(), result.getTitle(),
                result.getDescription(), result.getContentSnippet());
    }

    /**
     * POST /api/brain/suggestions/file — File upload + AI classification
     * (multipart).
     */
    @PostMapping(value = "/suggestions/file", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.OK)
    public BrainSuggestionDto suggestFromFile(@RequestPart("file") MultipartFile file) {
        String basePath = (contextPath != null ? contextPath : "");
        String mediaUrlPrefix = basePath + "/api/brain/media/";
        BrainSuggestionService.SuggestionResult result = brainSuggestionService.suggestFromFile(file, mediaUrlPrefix);
        return toSuggestionDto(result);
    }

    /**
     * GET /api/brain/media/{filename} — Serve media with HTTP Range support.
     */
    @GetMapping("/media/{filename:.+}")
    public ResponseEntity<?> getMedia(@PathVariable("filename") String filename, @RequestHeader HttpHeaders headers) {
        Resource resource = mediaStorageService.loadAsResource(filename);
        MediaType mediaType = mediaStorageService.detectMediaType(resource);

        // Determine if there is a valid Range header
        String rangeHeader = headers.getFirst(HttpHeaders.RANGE);
        boolean hasRange = rangeHeader != null && rangeHeader.startsWith("bytes=");

        // No valid Range header: return full resource
        if (!hasRange) {
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(resource);
        }

        try {
            MediaStorageService.RangeResult range = mediaStorageService.readRange(filename, rangeHeader);
            return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT)
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .header(HttpHeaders.CONTENT_RANGE, range.getContentRangeHeader())
                    .contentLength(range.getData().length)
                    .contentType(mediaType)
                    .body(range.getData());
        } catch (MediaStorageService.RangeNotSatisfiableException e) {
            return ResponseEntity.status(HttpStatus.REQUESTED_RANGE_NOT_SATISFIABLE)
                    .header(HttpHeaders.CONTENT_RANGE, e.getContentRangeHeader())
                    .build();
        } catch (Exception e) {
            // Fallback: return full resource if range reading fails
            return ResponseEntity.ok()
                    .header(HttpHeaders.ACCEPT_RANGES, "bytes")
                    .contentType(mediaType)
                    .body(resource);
        }
    }

    /**
     * DELETE /api/brain/media/{filename} — Delete media file (idempotent).
     */
    @DeleteMapping("/media/{filename:.+}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteMedia(@PathVariable("filename") String filename) {
        mediaStorageService.deleteFile(filename);
    }

    /**
     * POST /api/brain/notes — Persist a note as Markdown file.
     * Returns 201 CREATED.
     */
    @PostMapping("/notes")
    @ResponseStatus(HttpStatus.CREATED)
    public SavedNoteDto saveNote(@RequestBody SaveNoteParamsDto params) {
        NoteMarkdownStorageService.SaveResult result = noteMarkdownStorageService.saveNote(params);
        return new SavedNoteDto(result.getStorageId(), result.getFilename());
    }

    /**
     * DELETE /api/brain/notes/{storageId} — Delete a persisted note (idempotent).
     */
    @DeleteMapping("/notes/{storageId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteNote(@PathVariable("storageId") String storageId) {
        noteMarkdownStorageService.deleteByStorageId(storageId);
    }

    /**
     * POST /api/brain/fact-checks — Fact-check content via AI.
     */
    @PostMapping("/fact-checks")
    @ResponseStatus(HttpStatus.OK)
    public FactCheckResponseDto factCheck(@RequestBody FactCheckParamsDto params) {
        logger.info("Recibida petición de fact-checking para contenido");
        return new FactCheckResponseDto(llamaAIService.verifyInformation(params.getContent()));
    }

    /**
     * POST /api/brain/trends/insights — AI-generated trend insights.
     */
    @PostMapping("/trends/insights")
    @ResponseStatus(HttpStatus.OK)
    public TrendsInsightsResponseDto trendsInsights(@RequestBody TrendsInsightsParamsDto params) {
        logger.info("Recibida petición de tendencias (IA). WindowDays: {}. Topics: {}. Items: {}",
                params == null ? null : params.getWindowDays(),
                params == null || params.getTopics() == null ? null : params.getTopics().size(),
                params == null || params.getItems() == null ? null : params.getItems().size());
        return llamaAIService.generateTrendsInsights(params);
    }

    // ── DTO mapping ─────────────────────────────────────────────────────

    private BrainSuggestionDto toSuggestionDto(BrainSuggestionService.SuggestionResult result) {
        return new BrainSuggestionDto(
                result.getType(),
                result.getTitle(),
                result.getSummary(),
                result.getDetailedContent(),
                result.getDestination(),
                result.getTags(),
                result.getMediaUrl(),
                result.getMediaContentType());
    }
}
