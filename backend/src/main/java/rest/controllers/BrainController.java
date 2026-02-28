package es.udc.fi.dc.fd.rest.controllers;

import java.util.ArrayList;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import es.udc.fi.dc.fd.rest.dtos.BrainSuggestParamsDto;
import es.udc.fi.dc.fd.rest.dtos.BrainSuggestionDto;

/**
 * Endpoint sencillo que simula la "IA" del cerebro digital.
 *
 * Ahora mismo usa reglas heurísticas para clasificar y proponer título,
 * destino y etiquetas. Más adelante se puede sustituir la lógica interna por
 * llamadas reales a un modelo de IA.
 */
@RestController
@RequestMapping("/api/brain")
public class BrainController {

    @PostMapping("/suggest")
    @ResponseStatus(HttpStatus.OK)
    public BrainSuggestionDto suggest(@RequestBody BrainSuggestParamsDto params) {

        String content = params.getContent() == null ? "" : params.getContent().trim();

        // Tipo básico
        String type = detectType(content);

        // Título sencillo: primera línea o recorte
        String title = buildTitle(content, type);

        // Resumen: primeras frases/caracteres
        String summary = buildSummary(content);

        // Destino sugerido según contenido
        String destination = suggestDestination(content, type);

        // Etiquetas aproximadas según palabras clave
        String[] tags = suggestTags(content, type);

        return new BrainSuggestionDto(type, title, summary, destination, tags);
    }

    private String detectType(String content) {
        if (content.isEmpty()) {
            return "nota";
        }

        String lower = content.toLowerCase();

        if (lower.startsWith("http://") || lower.startsWith("https://")) {
            if (lower.contains("youtube.com") || lower.contains("youtu.be") || lower.contains("vimeo.com")) {
                return "video";
            }
            return "link";
        }

        if (lower.contains("todo") || lower.contains("- [ ]")) {
            return "tarea";
        }

        if (lower.contains("class ") || lower.contains("function ") || lower.contains("public static void")) {
            return "codigo";
        }

        return "nota";
    }

    private String buildTitle(String content, String type) {
        if (content.isEmpty()) {
            return "Nota";
        }

        String[] lines = content.split("\n");
        String firstLine = lines[0].trim();

        if (firstLine.length() > 80) {
            firstLine = firstLine.substring(0, 77) + "...";
        }

        if (type.equals("link")) {
            return "Enlace capturado";
        }

        if (type.equals("tarea")) {
            return "Lista de tareas";
        }

        return firstLine.isEmpty() ? "Nota" : firstLine;
    }

    private String buildSummary(String content) {
        if (content.isEmpty()) {
            return "";
        }

        String clean = content.replaceAll("\n+", " ").trim();
        if (clean.length() > 280) {
            clean = clean.substring(0, 277) + "...";
        }
        return clean;
    }

    private String suggestDestination(String content, String type) {
        String lower = content.toLowerCase();

        if (type.equals("tarea")) {
            return "tarea";
        }

        if (lower.contains("examen") || lower.contains("apuntes") || lower.contains("tema")) {
            return "apunte";
        }

        if (lower.contains("bug") || lower.contains("issue") || lower.contains("ticket")) {
            return "tarea";
        }

        if (lower.contains("idea") || lower.contains("brainstorm")) {
            return "idea";
        }

        if (type.equals("link") || lower.contains("doc") || lower.contains("documentacion")) {
            return "recurso";
        }

        return "apunte";
    }

    private String[] suggestTags(String content, String type) {
        List<String> tags = new ArrayList<>();
        String lower = content.toLowerCase();

        if (type.equals("codigo")) {
            tags.add("codigo");
        }

        if (type.equals("link")) {
            tags.add("link");
        }

        if (lower.contains("java") || lower.contains("spring")) {
            tags.add("backend");
        }

        if (lower.contains("react") || lower.contains("css") || lower.contains("frontend")) {
            tags.add("frontend");
        }

        if (lower.contains("bdd") || lower.contains("sql")) {
            tags.add("bbdd");
        }

        if (lower.contains("examen") || lower.contains("apuntes") || lower.contains("tema")) {
            tags.add("estudio");
        }

        if (tags.isEmpty()) {
            tags.add("nota");
        }

        return tags.toArray(new String[0]);
    }
}
