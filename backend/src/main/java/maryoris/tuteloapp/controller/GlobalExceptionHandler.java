package maryoris.tuteloapp.controller;

import jakarta.servlet.http.HttpServletRequest;
import maryoris.tuteloapp.dto.ApiErrorResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.BindException;
import org.springframework.web.HttpMediaTypeNotSupportedException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/*
 * CORRECCIÓN - Punto 6: Validaciones y manejo de excepciones
 * Se centraliza el manejo de excepciones del backend para unificar respuestas
 * de error, mejorar la claridad de mensajes y evitar manejo disperso en controllers.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiErrorResponse> handleResponseStatusException(
            ResponseStatusException ex,
            HttpServletRequest request
    ) {
        HttpStatus status = HttpStatus.valueOf(ex.getStatusCode().value());

        ApiErrorResponse body = buildError(
                status,
                ex.getReason() != null ? ex.getReason() : "Error de negocio",
                request.getRequestURI(),
                null
        );

        return ResponseEntity.status(status).body(body);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request
    ) {
        List<String> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .toList();

        ApiErrorResponse body = buildError(
                HttpStatus.BAD_REQUEST,
                "Error de validación",
                request.getRequestURI(),
                details
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(BindException.class)
    public ResponseEntity<ApiErrorResponse> handleBindException(
            BindException ex,
            HttpServletRequest request
    ) {
        List<String> details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(err -> err.getField() + ": " + err.getDefaultMessage())
                .toList();

        ApiErrorResponse body = buildError(
                HttpStatus.BAD_REQUEST,
                "Error de binding/validación",
                request.getRequestURI(),
                details
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler({
            MissingServletRequestParameterException.class,
            MissingServletRequestPartException.class,
            MethodArgumentTypeMismatchException.class,
            HttpMediaTypeNotSupportedException.class,
            HttpRequestMethodNotSupportedException.class
    })
    public ResponseEntity<ApiErrorResponse> handleBadRequestExceptions(
            Exception ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = buildError(
                HttpStatus.BAD_REQUEST,
                ex.getMessage(),
                request.getRequestURI(),
                null
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiErrorResponse> handleMaxUploadSizeExceeded(
            MaxUploadSizeExceededException ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = buildError(
                HttpStatus.BAD_REQUEST,
                "El archivo excede el tamaño máximo permitido",
                request.getRequestURI(),
                null
        );

        return ResponseEntity.badRequest().body(body);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiErrorResponse> handleGenericException(
            Exception ex,
            HttpServletRequest request
    ) {
        ApiErrorResponse body = buildError(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocurrió un error interno inesperado",
                request.getRequestURI(),
                List.of(ex.getClass().getSimpleName())
        );

        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(body);
    }

    private ApiErrorResponse buildError(
            HttpStatus status,
            String message,
            String path,
            List<String> details
    ) {
        return new ApiErrorResponse(
                LocalDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                message,
                path,
                details
        );
    }
}