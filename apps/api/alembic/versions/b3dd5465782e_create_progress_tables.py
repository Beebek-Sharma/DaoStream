"""create_progress_tables

Revision ID: b3dd5465782e
Revises: d98998ac5637
Create Date: 2026-10-06 18:38:20.185026

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b3dd5465782e'
down_revision: Union[str, Sequence[str], None] = 'd98998ac5637'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        'watch_progress',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('media_id', sa.String(length=36), nullable=False),
        sa.Column('episode_id', sa.String(length=36), nullable=True),
        sa.Column('position', sa.Float(), nullable=False),
        sa.Column('duration', sa.Float(), nullable=False),
        sa.Column('percentage', sa.Float(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['media_id'], ['media.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['episode_id'], ['episodes.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'media_id', 'episode_id', name='uq_user_media_episode_progress')
    )
    with op.batch_alter_table('watch_progress', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_watch_progress_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_watch_progress_media_id'), ['media_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_watch_progress_episode_id'), ['episode_id'], unique=False)

    op.create_table(
        'reading_progress',
        sa.Column('id', sa.String(length=36), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('book_id', sa.String(length=36), nullable=False),
        sa.Column('location', sa.String(length=512), nullable=False),
        sa.Column('percentage', sa.Float(), nullable=False),
        sa.Column('completed', sa.Boolean(), nullable=False),
        sa.Column('bookmarks', sa.JSON(), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=False),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['book_id'], ['books.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('user_id', 'book_id', name='uq_user_book_progress')
    )
    with op.batch_alter_table('reading_progress', schema=None) as batch_op:
        batch_op.create_index(batch_op.f('ix_reading_progress_user_id'), ['user_id'], unique=False)
        batch_op.create_index(batch_op.f('ix_reading_progress_book_id'), ['book_id'], unique=False)


def downgrade() -> None:
    with op.batch_alter_table('reading_progress', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_reading_progress_book_id'))
        batch_op.drop_index(batch_op.f('ix_reading_progress_user_id'))
    op.drop_table('reading_progress')

    with op.batch_alter_table('watch_progress', schema=None) as batch_op:
        batch_op.drop_index(batch_op.f('ix_watch_progress_episode_id'))
        batch_op.drop_index(batch_op.f('ix_watch_progress_media_id'))
        batch_op.drop_index(batch_op.f('ix_watch_progress_user_id'))
    op.drop_table('watch_progress')
