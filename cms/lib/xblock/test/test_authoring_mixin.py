from openedx.core.djangoapps.course_groups.partition_scheme import CohortPartitionScheme
from xmodule.modulestore.tests.django_utils import ModuleStoreTestCase
from xmodule.modulestore.tests.factories import CourseFactory, ItemFactory
from xmodule.partitions.partitions import Group, UserPartition


class AuthoringMixinTestCase(ModuleStoreTestCase):
    """
    Tests the studio authoring XBlock mixin.
    """
    def setUp(self):
        """
        Create a simple course with a video component.
        """
        super(AuthoringMixinTestCase, self).setUp()
        self.course = CourseFactory.create()
        chapter = ItemFactory.create(
            category='chapter',
            parent_location=self.course.location,
            display_name='Test Chapter'
        )
        sequential = ItemFactory.create(
            category='sequential',
            parent_location=chapter.location,
            display_name='Test Sequential'
        )
        self.vertical = ItemFactory.create(
            category='vertical',
            parent_location=sequential.location,
            display_name='Test Vertical'
        )
        self.video = ItemFactory.create(
            category='video',
            parent_location=self.vertical.location,
            display_name='Test Vertical'
        )
        self.pet_groups = [Group(1, 'Cat Lovers'), Group(2, 'Dog Lovers')]

    def create_cohorted_content_groups(self, groups):
        """
        Create a cohorted content partition with specified groups.
        """
        self.content_partition = UserPartition(
            1,
            'Content Groups',
            'Contains Groups for Cohorted Courseware',
            groups,
            scheme_id='cohort'
        )
        self.course.user_partitions = [self.content_partition]
        self.store.update_item(self.course, self.user.id)

    def set_staff_only(self, item):
        """Make an item visible to staff only."""
        item.visible_to_staff_only = True
        self.store.update_item(item, self.user.id)

    def set_group_access(self, item, group_ids):
        """
        Set group_access for the specified item to the specified group
        ids within the content partition.
        """
        item.group_access[self.content_partition.id] = group_ids
        self.store.update_item(item, self.user.id)

    def verify_visibility_view_contains(self, item, substrings):
        """
        Verify that an item's visibility view returns an html string
        containing all the expected substrings.
        """
        html = item.visibility_view().body_html()
        for string in substrings:
            self.assertIn(string, html)

    def test_html_no_partition(self):
        self.verify_visibility_view_contains(self.video, 'You have not set up any groups to manage visibility with.')

    def test_html_empty_partition(self):
        self.create_cohorted_content_groups([])
        self.verify_visibility_view_contains(self.video, 'You have not set up any groups to manage visibility with.')

    def test_html_populated_partition(self):
        self.create_cohorted_content_groups(self.pet_groups)
        self.verify_visibility_view_contains(self.video, ['Cat Lovers', 'Dog Lovers'])

    def test_html_no_partition_staff_locked(self):
        self.set_staff_only(self.vertical)
        self.verify_visibility_view_contains(self.video, ['You have not set up any groups to manage visibility with.'])

    def test_html_empty_partition_staff_locked(self):
        self.create_cohorted_content_groups([])
        self.set_staff_only(self.vertical)
        self.verify_visibility_view_contains(self.video, 'You have not set up any groups to manage visibility with.')

    def test_html_populated_partition_staff_locked(self):
        self.create_cohorted_content_groups(self.pet_groups)
        self.set_staff_only(self.vertical)
        self.verify_visibility_view_contains(
            self.video, ['The Unit this component is contained in is hidden from students.', 'Cat Lovers', 'Dog Lovers']
        )

    def test_html_false_content_group(self):
        self.create_cohorted_content_groups(self.pet_groups)
        self.set_group_access(self.video, ['false_group_id'])
        self.verify_visibility_view_contains(
            self.video, ['Cat Lovers', 'Dog Lovers', 'Content group no longer exists.']
        )

    def test_html_false_content_group_staff_locked(self):
        self.create_cohorted_content_groups(self.pet_groups)
        self.set_staff_only(self.vertical)
        self.set_group_access(self.video, ['false_group_id'])
        self.verify_visibility_view_contains(
            self.video,
            [
                'Cat Lovers',
                'Dog Lovers',
                'The Unit this component is contained in is hidden from students.',
                'Content group no longer exists.'
            ]
        )
