define([
    'jquery', 'underscore', 'js/common_helpers/template_helpers',
    'js/spec/edxnotes/helpers', 'logger', 'js/edxnotes/models/note',
    'js/edxnotes/views/note_item', 'js/spec/edxnotes/custom_matchers'
], function(
    $, _, TemplateHelpers, Helpers, Logger, NoteModel, NoteItemView, customMatchers
) {
    'use strict';
    describe('EdxNotes NoteItemView', function() {
        var getView = function (model) {
            model = new NoteModel(_.defaults(model || {}, {
                id: 'id-123',
                user: 'user-123',
                usage_id: 'usage_id-123',
                created: 'December 11, 2014 at 11:12AM',
                updated: 'December 11, 2014 at 11:12AM',
                text: 'Third added model',
                quote: Helpers.LONG_TEXT
                unit: {
                    url: ''
                }
            }));

            return new NoteItemView({model: model}).render();
        };

        beforeEach(function() {
            customMatchers(this);
            TemplateHelpers.installTemplate('templates/edxnotes/note-item');
            spyOn(Logger, 'log');
        });

        it('can be rendered properly', function() {
            var view = getView(),
                unitLink = view.$('.reference-unit-link').get(0);

            expect(view.$el).toContain('.note-excerpt-more-link');
            expect(view.$el).toContainText(Helpers.TRUNCATED_TEXT);
            expect(view.$el).toContainText('More');
            view.$('.note-excerpt-more-link').click();

            expect(view.$el).toContainText(Helpers.LONG_TEXT);
            expect(view.$el).toContainText('(Show less)');

            view = getView({quote: Helpers.SHORT_TEXT});
            expect(view.$el).not.toContain('.note-excerpt-more-link');
            expect(view.$el).toContainText(Helpers.SHORT_TEXT);

            expect(unitLink.hash).toBe('#id-123');
        });

        it('should display update value and accompanying text', function() {
            var view = getView();
            expect(view.$('.reference-title').last()).toContainText('Last Edited:');
            expect(view.$('.reference-meta').last()).toContainText('December 11, 2014 at 11:12AM');
        });

        it('should log the edx.student_notes.went_to_unit event properly', function () {
            var view = getView();
            spyOn(view, 'redirectTo');
            view.$('.reference-unit-link').click();
            expect(Logger.log).toHaveBeenCalledWith('edx.student_notes.went_to_unit', {
                'user': 'user-123',
                'note_id': 'id-123',
                'usage_id': 'usage_id-123',
                'datetime': jasmine.any(Date)
            }, null, {async: false});
            expect(view.redirectTo).toHaveBeenCalledWith('#id-123');
        });
    });
});
