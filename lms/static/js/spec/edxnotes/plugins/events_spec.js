define([
    'jquery', 'underscore', 'annotator', 'logger', 'js/edxnotes/views/notes_factory'
], function($, _, Annotator, Logger, NotesFactory) {
    'use strict';
    describe('EdxNotes Events Plugin', function() {
        var note = {
            user: 'user-123',
            id: 'note-123',
            text: 'text-123',
            quote: 'quote-123',
            usage_id: 'usage-123'
        };

        beforeEach(function() {
            this.annotator =  NotesFactory.factory(
                $('<div />').get(0), {
                    endpoint: 'http://example.com/'
                }
            );
            spyOn(Logger, 'log');
        });

        afterEach(function () {
            _.invoke(Annotator._instances, 'destroy');
        });

        it('should log edx.course.student_notes.viewed event properly', function() {
            this.annotator.publish('annotationViewerShown', [
                this.annotator.viewer,
                [note, {user: 'user-456', id: 'note-456'}]]
            );
            expect(Logger.log).toHaveBeenCalledWith(
                'edx.course.student_notes.viewed', [
                    {
                        user: 'user-123',
                        note_id: 'note-123',
                        datetime: jasmine.any(Date)
                    },
                    {
                        user: 'user-456',
                        note_id: 'note-456',
                        datetime: jasmine.any(Date)
                    }
                ]
            );
        });

        it('should log edx.course.student_notes.added event properly', function() {
            this.annotator.publish('annotationCreated', note);
            expect(Logger.log).toHaveBeenCalledWith(
                'edx.course.student_notes.added', {
                    user: 'user-123',
                    note_id: 'note-123',
                    note_text: 'text-123',
                    highlighted_content: 'quote-123',
                    usage_id: 'usage-123',
                    datetime: jasmine.any(Date)
                }
            );
        });

        it('should log the edx.course.student_notes.edited event properly', function() {
            var old_note = note,
                new_note = $.extend({}, note, {text: 'text-456'});

            this.annotator.publish('annotationEditorShown', [this.annotator.editor, old_note]);
            expect(this.annotator.plugins.Events.oldNoteText).toBe('text-123');
            this.annotator.publish('annotationUpdated', new_note);
            this.annotator.publish('annotationEditorHidden', [this.annotator.editor, new_note]);

            expect(Logger.log).toHaveBeenCalledWith(
                'edx.course.student_notes.edited', {
                    user: 'user-123',
                    note_id: 'note-123',
                    old_note_text: 'text-123',
                    note_text: 'text-456',
                    highlighted_content: 'quote-123',
                    usage_id: 'usage-123',
                    datetime: jasmine.any(Date)
                }
            );
            expect(this.annotator.plugins.Events.oldNoteText).toBeNull();
        });

        it('should log the edx.course.student_notes.deleted event properly', function() {
            this.annotator.publish('annotationDeleted', note);
            expect(Logger.log).toHaveBeenCalledWith(
                'edx.course.student_notes.deleted', {
                    user: 'user-123',
                    note_id: 'note-123',
                    note_text: 'text-123',
                    highlighted_content: 'quote-123',
                    usage_id: 'usage-123',
                    datetime: jasmine.any(Date)
                }
            );
        });
    });
});
